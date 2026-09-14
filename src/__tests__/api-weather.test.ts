import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the database module before imports
vi.mock("@/lib/database", () => ({
  getDatabase: vi.fn(() => ({
    addSearch: vi.fn(),
    getRecentSearches: vi.fn(() => []),
    searchCities: vi.fn(() => []),
  })),
}));

// Mock the cache module
vi.mock("@/lib/cache", () => {
  const mockCache = new Map();
  return {
    weatherCache: {
      get: vi.fn((key: string) => mockCache.get(key.toLowerCase().trim())),
      set: vi.fn((key: string, data: unknown) =>
        mockCache.set(key.toLowerCase().trim(), data)
      ),
      has: vi.fn((key: string) => mockCache.has(key.toLowerCase().trim())),
      clear: vi.fn(() => mockCache.clear()),
    },
  };
});

// Import after mocks
import { GET } from "@/app/api/weather/route";
import { weatherCache } from "@/lib/cache";
import { getDatabase } from "@/lib/database";

describe("Weather API Route", () => {
  const mockCurrentWeatherResponse = {
    coord: { lon: -0.1257, lat: 51.5085 },
    weather: [
      { id: 800, main: "Clear", description: "clear sky", icon: "01d" },
    ],
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
      weather: [
        { id: 800, main: "Clear", description: "clear sky", icon: "01d" },
      ],
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

  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = process.env;
    process.env = { ...originalEnv, OPENWEATHER_API_KEY: "test-api-key" };
    vi.clearAllMocks();
    (weatherCache.clear as ReturnType<typeof vi.fn>)();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  describe("successful requests", () => {
    it("should return weather data for a valid city", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/weather")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCurrentWeatherResponse),
          });
        }
        if (url.includes("/forecast")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockForecastResponse),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.current).toBeDefined();
      expect(data.data.current.city).toBe("London");
      expect(data.data.current.country).toBe("GB");
      expect(data.data.current.temperature).toBeDefined();
      expect(data.data.forecast).toBeDefined();
      expect(Array.isArray(data.data.forecast)).toBe(true);
    });

    it("should indicate when data is from cache", async () => {
      // First, mock the cache to return cached data
      const cachedData = {
        current: {
          city: "London",
          country: "GB",
          temperature: 20,
          feelsLike: 19,
          humidity: 65,
          windSpeed: 3.5,
          description: "clear sky",
          icon: "01d",
          sunrise: 1704094800,
          sunset: 1704127200,
          timestamp: 1704110400,
        },
        forecast: [],
      };

      (weatherCache.has as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (weatherCache.get as ReturnType<typeof vi.fn>).mockReturnValue(
        cachedData
      );

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cached).toBe(true);
    });

    it("should still return weather data when saving the recent search fails", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/weather")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCurrentWeatherResponse),
          });
        }
        if (url.includes("/forecast")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockForecastResponse),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      (getDatabase as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        addSearch: vi.fn(() => {
          throw new Error("database is locked");
        }),
        getRecentSearches: vi.fn(() => []),
        searchCities: vi.fn(() => []),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.current.city).toBe("London");
    });
  });

  describe("error handling", () => {
    it("should return 400 for missing city parameter", async () => {
      const request = new NextRequest("http://localhost:3000/api/weather");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_CITY");
      expect(data.error).toBe("City parameter is required");
    });

    it("should return 400 for empty city parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/weather?city="
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_CITY");
    });

    it("should return 400 for a numeric city parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=12345"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_CITY");
    });

    it("should return 400 for a city name mixed with digits", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London123"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_CITY");
    });

    it("should return 404 with a generic message and the query when the upstream can't find the city", async () => {
      (weatherCache.has as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (weatherCache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=NotARealCityName"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_CITY");
      // Generic message, not whatever the upstream sent back.
      expect(data.error).toBe("City not found");
      expect(data.query).toBe("NotARealCityName");
    });

    it("should return 502 (not the upstream's raw status) when the upstream API fails with a 5xx", async () => {
      (weatherCache.has as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (weatherCache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.success).toBe(false);
      expect(data.code).toBe("API_ERROR");
    });

    it("should return 429 when rate limited", async () => {
      (weatherCache.has as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (weatherCache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.code).toBe("RATE_LIMIT");
    });

    it("should return 500 when API key is missing", async () => {
      delete process.env.OPENWEATHER_API_KEY;
      (weatherCache.has as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (weatherCache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe("MISSING_API_KEY");
    });

    it("should return 502 when the upstream is unreachable (network error)", async () => {
      (weatherCache.has as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (weatherCache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.success).toBe(false);
      expect(data.code).toBe("NETWORK_ERROR");
    });

    it("should return 504 when the upstream request times out", async () => {
      (weatherCache.has as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (weatherCache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);

      global.fetch = vi
        .fn()
        .mockRejectedValue(
          new DOMException("The operation timed out.", "TimeoutError")
        );

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.success).toBe(false);
      expect(data.code).toBe("NETWORK_ERROR");
    });

    it("should return 500 UNKNOWN_ERROR for a failure that isn't a WeatherApiError", async () => {
      (weatherCache.has as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("cache blew up");
      });

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe("UNKNOWN_ERROR");
      expect(data.error).toBe("An unexpected error occurred");
    });
  });

  describe("response shape validation", () => {
    it("should return properly structured weather data", async () => {
      (weatherCache.has as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (weatherCache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/weather")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCurrentWeatherResponse),
          });
        }
        if (url.includes("/forecast")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockForecastResponse),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const request = new NextRequest(
        "http://localhost:3000/api/weather?city=London"
      );
      const response = await GET(request);
      const data = await response.json();

      // Validate current weather shape
      const current = data.data.current;
      expect(current).toHaveProperty("city");
      expect(current).toHaveProperty("country");
      expect(current).toHaveProperty("temperature");
      expect(current).toHaveProperty("feelsLike");
      expect(current).toHaveProperty("humidity");
      expect(current).toHaveProperty("windSpeed");
      expect(current).toHaveProperty("description");
      expect(current).toHaveProperty("icon");
      expect(current).toHaveProperty("sunrise");
      expect(current).toHaveProperty("sunset");

      // Validate forecast shape
      expect(Array.isArray(data.data.forecast)).toBe(true);
    });

    it("should return properly structured error response", async () => {
      const request = new NextRequest("http://localhost:3000/api/weather");
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty("code");
      expect(typeof data.error).toBe("string");
      expect(typeof data.code).toBe("string");
    });
  });
});
