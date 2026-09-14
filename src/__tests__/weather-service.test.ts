import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  fetchWeatherData,
  isWeatherCached,
  WeatherApiError,
} from "@/lib/weather-service";
import { weatherCache } from "@/lib/cache";

const mockCurrentWeatherResponse = {
  coord: { lon: -0.1257, lat: 51.5085 },
  weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
  main: {
    temp: 20,
    feels_like: 19,
    temp_min: 18,
    temp_max: 22,
    pressure: 1015,
    humidity: 65,
  },
  visibility: 10000,
  wind: { speed: 3.5, deg: 180 },
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

const mockForecastResponse = {
  cod: "200",
  message: 0,
  cnt: 8,
  list: Array.from({ length: 8 }, (_, i) => ({
    dt: 1704110400 + i * 3600 * 3,
    main: {
      temp: 15 + i,
      feels_like: 14 + i,
      temp_min: 12,
      temp_max: 18,
      pressure: 1015,
      humidity: 65,
    },
    weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
    clouds: { all: 0 },
    wind: { speed: 3.5, deg: 180 },
    visibility: 10000,
    pop: 0.1,
    sys: { pod: "d" },
    dt_txt: `2024-01-01 ${String(i * 3).padStart(2, "0")}:00:00`,
  })),
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

function mockFetchByUrl(handlers: {
  weather?: { ok: boolean; status?: number; json?: () => Promise<unknown> };
  forecast?: { ok: boolean; status?: number; json?: () => Promise<unknown> };
}) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("/forecast") && handlers.forecast) {
      return Promise.resolve(handlers.forecast);
    }
    if (url.includes("/weather") && handlers.weather) {
      return Promise.resolve(handlers.weather);
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
}

describe("weather-service", () => {
  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = process.env;
    process.env = { ...originalEnv, OPENWEATHER_API_KEY: "test-api-key" };
    weatherCache.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  describe("fetchWeatherData", () => {
    it("rejects with a 400 INVALID_CITY error for a blank city, bypassing fetch entirely", async () => {
      global.fetch = vi.fn();

      await expect(fetchWeatherData("   ")).rejects.toMatchObject({
        code: "INVALID_CITY",
        statusCode: 400,
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("rejects with a 500 MISSING_API_KEY error when no API key is configured", async () => {
      delete process.env.OPENWEATHER_API_KEY;

      await expect(fetchWeatherData("London")).rejects.toMatchObject({
        code: "MISSING_API_KEY",
        statusCode: 500,
      });
    });

    it("fetches, transforms, and caches weather data on success", async () => {
      global.fetch = mockFetchByUrl({
        weather: {
          ok: true,
          json: () => Promise.resolve(mockCurrentWeatherResponse),
        },
        forecast: {
          ok: true,
          json: () => Promise.resolve(mockForecastResponse),
        },
      });

      const result = await fetchWeatherData("London");
      expect(result.current.city).toBe("London");
      expect(result.current.country).toBe("GB");
      expect(Array.isArray(result.forecast)).toBe(true);

      // Second call should be served from cache without hitting fetch again.
      (global.fetch as ReturnType<typeof vi.fn>).mockClear();
      const cached = await fetchWeatherData("London");
      expect(cached).toEqual(result);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("maps an upstream 404 to a 404 INVALID_CITY error with a generic message and the query", async () => {
      global.fetch = mockFetchByUrl({
        weather: { ok: false, status: 404 },
        forecast: { ok: true, json: () => Promise.resolve(mockForecastResponse) },
      });

      await expect(fetchWeatherData("Nowhereville")).rejects.toMatchObject({
        code: "INVALID_CITY",
        statusCode: 404,
        message: "City not found",
        query: "Nowhereville",
      });
    });

    it("maps an upstream 429 to a 429 RATE_LIMIT error", async () => {
      global.fetch = mockFetchByUrl({
        weather: { ok: false, status: 429 },
        forecast: { ok: true, json: () => Promise.resolve(mockForecastResponse) },
      });

      await expect(fetchWeatherData("London")).rejects.toMatchObject({
        code: "RATE_LIMIT",
        statusCode: 429,
      });
    });

    it("maps an upstream 401/403 to a MISSING_API_KEY error with the upstream status", async () => {
      global.fetch = mockFetchByUrl({
        weather: { ok: false, status: 401 },
        forecast: { ok: true, json: () => Promise.resolve(mockForecastResponse) },
      });

      await expect(fetchWeatherData("London")).rejects.toMatchObject({
        code: "MISSING_API_KEY",
        statusCode: 401,
      });
    });

    it("maps an upstream 5xx to a 502 API_ERROR without leaking the upstream status", async () => {
      global.fetch = mockFetchByUrl({
        weather: { ok: false, status: 500 },
        forecast: { ok: true, json: () => Promise.resolve(mockForecastResponse) },
      });

      await expect(fetchWeatherData("London")).rejects.toMatchObject({
        code: "API_ERROR",
        statusCode: 502,
      });
    });

    it("maps a forecast-only failure (current weather ok) the same way as a current-weather failure", async () => {
      global.fetch = mockFetchByUrl({
        weather: {
          ok: true,
          json: () => Promise.resolve(mockCurrentWeatherResponse),
        },
        forecast: { ok: false, status: 500 },
      });

      await expect(fetchWeatherData("London")).rejects.toMatchObject({
        code: "API_ERROR",
        statusCode: 502,
      });
    });

    it("maps a generic network failure to a 502 NETWORK_ERROR", async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

      await expect(fetchWeatherData("London")).rejects.toMatchObject({
        code: "NETWORK_ERROR",
        statusCode: 502,
      });
    });

    it("maps a timeout (AbortSignal.timeout) to a 504 NETWORK_ERROR", async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValue(new DOMException("timed out", "TimeoutError"));

      await expect(fetchWeatherData("London")).rejects.toMatchObject({
        code: "NETWORK_ERROR",
        statusCode: 504,
      });
    });
  });

  describe("isWeatherCached", () => {
    it("returns false when nothing is cached for the city", () => {
      expect(isWeatherCached("Nowhere")).toBe(false);
    });

    it("returns true once the city has been fetched and cached", async () => {
      global.fetch = mockFetchByUrl({
        weather: {
          ok: true,
          json: () => Promise.resolve(mockCurrentWeatherResponse),
        },
        forecast: {
          ok: true,
          json: () => Promise.resolve(mockForecastResponse),
        },
      });

      await fetchWeatherData("London");
      expect(isWeatherCached("London")).toBe(true);
    });
  });

  describe("WeatherApiError", () => {
    it("carries the message, code, statusCode, and optional query", () => {
      const err = new WeatherApiError("boom", "API_ERROR", 502, "Berlin");
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("boom");
      expect(err.code).toBe("API_ERROR");
      expect(err.statusCode).toBe(502);
      expect(err.query).toBe("Berlin");
    });
  });
});
