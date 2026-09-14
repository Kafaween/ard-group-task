import { describe, it, expect, vi } from "vitest";
import {
  transformCurrentWeather,
  transformForecast,
  getDayName,
  formatDate,
  getWeatherIconUrl,
} from "@/lib/weather-service";
import type {
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
} from "@/types/weather";

describe("Weather Service - Data Transformation", () => {
  describe("getDayName", () => {
    it("should return abbreviated day name from timestamp", () => {
      // Monday, January 1, 2024 12:00:00 UTC
      const timestamp = 1704110400;
      const dayName = getDayName(timestamp);
      expect(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]).toContain(
        dayName
      );
    });
  });

  describe("formatDate", () => {
    it("should format timestamp to month and day", () => {
      // January 15, 2024 12:00:00 UTC
      const timestamp = 1705320000;
      const formattedDate = formatDate(timestamp);
      expect(formattedDate).toMatch(/Jan\s+15/);
    });
  });

  describe("getWeatherIconUrl", () => {
    it("should return correct OpenWeatherMap icon URL", () => {
      const iconCode = "01d";
      const url = getWeatherIconUrl(iconCode);
      expect(url).toBe("https://openweathermap.org/img/wn/01d@2x.png");
    });

    it("should handle night icons", () => {
      const iconCode = "01n";
      const url = getWeatherIconUrl(iconCode);
      expect(url).toBe("https://openweathermap.org/img/wn/01n@2x.png");
    });
  });

  describe("transformCurrentWeather", () => {
    const mockCurrentResponse: OpenWeatherCurrentResponse = {
      coord: { lon: -0.1257, lat: 51.5085 },
      weather: [
        {
          id: 800,
          main: "Clear",
          description: "clear sky",
          icon: "01d",
        },
      ],
      base: "stations",
      main: {
        temp: 20.5,
        feels_like: 19.8,
        temp_min: 18.0,
        temp_max: 22.0,
        pressure: 1015,
        humidity: 65,
      },
      visibility: 10000,
      wind: {
        speed: 3.5,
        deg: 180,
      },
      clouds: { all: 0 },
      dt: 1704110400,
      sys: {
        type: 2,
        id: 2075535,
        country: "GB",
        sunrise: 1704094800,
        sunset: 1704127200,
      },
      timezone: 0,
      id: 2643743,
      name: "London",
      cod: 200,
    };

    it("should transform current weather response correctly", () => {
      const result = transformCurrentWeather(mockCurrentResponse);

      expect(result.city).toBe("London");
      expect(result.country).toBe("GB");
      expect(result.temperature).toBe(21); // Rounded from 20.5
      expect(result.feelsLike).toBe(20); // Rounded from 19.8
      expect(result.humidity).toBe(65);
      expect(result.windSpeed).toBe(3.5);
      expect(result.description).toBe("clear sky");
      expect(result.icon).toBe("01d");
      expect(result.sunrise).toBe(1704094800);
      expect(result.sunset).toBe(1704127200);
      expect(result.timestamp).toBe(1704110400);
    });

    it("should handle missing weather description gracefully", () => {
      const responseWithEmptyWeather = {
        ...mockCurrentResponse,
        weather: [],
      };

      const result = transformCurrentWeather(responseWithEmptyWeather);
      expect(result.description).toBe("Unknown");
      expect(result.icon).toBe("01d");
    });

    it("should round temperature to nearest integer", () => {
      const responseWithDecimalTemp = {
        ...mockCurrentResponse,
        main: {
          ...mockCurrentResponse.main,
          temp: 25.7,
          feels_like: 24.3,
        },
      };

      const result = transformCurrentWeather(responseWithDecimalTemp);
      expect(result.temperature).toBe(26);
      expect(result.feelsLike).toBe(24);
    });
  });

  describe("transformForecast", () => {
    // Mock a forecast response with data for multiple days
    const createMockForecastResponse = (): OpenWeatherForecastResponse => {
      const baseTimestamp = 1704110400; // January 1, 2024
      const items = [];

      // Create 3 hour intervals for 5 days (40 items)
      for (let i = 0; i < 40; i++) {
        const dt = baseTimestamp + i * 3 * 60 * 60;
        const date = new Date(dt * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const timeStr = date.toISOString().split("T")[1].substring(0, 8);

        items.push({
          dt,
          main: {
            temp: 15 + Math.sin(i) * 5, // Varying temperature
            feels_like: 14 + Math.sin(i) * 5,
            temp_min: 12,
            temp_max: 18,
            pressure: 1015,
            humidity: 60 + Math.floor(Math.random() * 20),
          },
          weather: [
            {
              id: 800,
              main: "Clear",
              description: "clear sky",
              icon: "01d",
            },
          ],
          clouds: { all: 0 },
          wind: {
            speed: 3 + Math.random() * 2,
            deg: 180,
          },
          visibility: 10000,
          pop: 0.1 + Math.random() * 0.3,
          sys: { pod: "d" },
          dt_txt: `${dateStr} ${timeStr}`,
        });
      }

      return {
        cod: "200",
        message: 0,
        cnt: 40,
        list: items,
        city: {
          id: 2643743,
          name: "London",
          coord: { lat: 51.5085, lon: -0.1257 },
          country: "GB",
          population: 1000000,
          timezone: 0,
          sunrise: 1704094800,
          sunset: 1704127200,
        },
      };
    };

    it("should transform forecast into daily forecasts", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-12-31")); // Day before the forecast data

      const mockResponse = createMockForecastResponse();
      const result = transformForecast(mockResponse);

      expect(result.length).toBeLessThanOrEqual(4);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include high and low temperatures for each day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-12-31"));

      const mockResponse = createMockForecastResponse();
      const result = transformForecast(mockResponse);

      result.forEach((day) => {
        expect(typeof day.tempHigh).toBe("number");
        expect(typeof day.tempLow).toBe("number");
        expect(day.tempHigh).toBeGreaterThanOrEqual(day.tempLow);
      });
    });

    it("should include day name and date", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-12-31"));

      const mockResponse = createMockForecastResponse();
      const result = transformForecast(mockResponse);

      result.forEach((day) => {
        expect(day.dayName).toBeTruthy();
        expect(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]).toContain(
          day.dayName
        );
        expect(day.date).toBeTruthy();
      });
    });

    it("should include weather details", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-12-31"));

      const mockResponse = createMockForecastResponse();
      const result = transformForecast(mockResponse);

      result.forEach((day) => {
        expect(typeof day.humidity).toBe("number");
        expect(typeof day.windSpeed).toBe("number");
        expect(typeof day.precipitation).toBe("number");
        expect(day.description).toBeTruthy();
        expect(day.icon).toBeTruthy();
      });
    });

    it("should handle empty forecast list", () => {
      const emptyResponse: OpenWeatherForecastResponse = {
        cod: "200",
        message: 0,
        cnt: 0,
        list: [],
        city: {
          id: 2643743,
          name: "London",
          coord: { lat: 51.5085, lon: -0.1257 },
          country: "GB",
          population: 1000000,
          timezone: 0,
          sunrise: 1704094800,
          sunset: 1704127200,
        },
      };

      const result = transformForecast(emptyResponse);
      expect(result).toEqual([]);
    });

    it("should skip the current day's data instead of including it as a forecast", () => {
      vi.useFakeTimers();
      // The mock data's first day is 2024-01-01 — set "today" to match it.
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      const mockResponse = createMockForecastResponse();
      const result = transformForecast(mockResponse);

      expect(result.every((day) => day.date !== "Jan 1")).toBe(true);

      vi.useRealTimers();
    });

    it("should fall back to a middle item when no midday (12:00:00) entry exists for a day", () => {
      const response: OpenWeatherForecastResponse = {
        cod: "200",
        message: 0,
        cnt: 2,
        list: [
          {
            dt: 1704153600,
            main: {
              temp: 10,
              feels_like: 9,
              temp_min: 8,
              temp_max: 12,
              pressure: 1010,
              humidity: 70,
            },
            weather: [
              { id: 801, main: "Clouds", description: "few clouds", icon: "02d" },
            ],
            clouds: { all: 20 },
            wind: { speed: 2, deg: 90 },
            visibility: 10000,
            pop: 0,
            sys: { pod: "d" },
            dt_txt: "2024-01-02 06:00:00",
          },
          {
            dt: 1704175200,
            main: {
              temp: 14,
              feels_like: 13,
              temp_min: 8,
              temp_max: 12,
              pressure: 1010,
              humidity: 70,
            },
            weather: [
              { id: 801, main: "Clouds", description: "few clouds", icon: "02d" },
            ],
            clouds: { all: 20 },
            wind: { speed: 2, deg: 90 },
            visibility: 10000,
            pop: 0,
            sys: { pod: "d" },
            dt_txt: "2024-01-02 12:01:00",
          },
        ],
        city: {
          id: 2643743,
          name: "London",
          coord: { lat: 51.5085, lon: -0.1257 },
          country: "GB",
          population: 1000000,
          timezone: 0,
          sunrise: 1704094800,
          sunset: 1704127200,
        },
      };

      const result = transformForecast(response);
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe("few clouds");
    });

    it("should default description and icon to Unknown/01d when a forecast item has no weather entries", () => {
      const response: OpenWeatherForecastResponse = {
        cod: "200",
        message: 0,
        cnt: 1,
        list: [
          {
            dt: 1704153600,
            main: {
              temp: 10,
              feels_like: 9,
              temp_min: 8,
              temp_max: 12,
              pressure: 1010,
              humidity: 70,
            },
            weather: [],
            clouds: { all: 20 },
            wind: { speed: 2, deg: 90 },
            visibility: 10000,
            pop: 0,
            sys: { pod: "d" },
            dt_txt: "2024-01-02 12:00:00",
          },
        ],
        city: {
          id: 2643743,
          name: "London",
          coord: { lat: 51.5085, lon: -0.1257 },
          country: "GB",
          population: 1000000,
          timezone: 0,
          sunrise: 1704094800,
          sunset: 1704127200,
        },
      };

      const result = transformForecast(response);
      expect(result[0].description).toBe("Unknown");
      expect(result[0].icon).toBe("01d");
    });
  });
});
