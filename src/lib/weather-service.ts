import type {
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
  OpenWeatherForecastItem,
  CurrentWeather,
  DayForecast,
  WeatherData,
  WeatherErrorCode,
} from "@/types/weather";
import { weatherCache } from "./cache";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

// Get day name from timestamp
export function getDayName(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

// Format date from timestamp
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get weather icon URL
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Transform OpenWeatherMap current weather response to internal format
export function transformCurrentWeather(
  data: OpenWeatherCurrentResponse
): CurrentWeather {
  return {
    city: data.name,
    country: data.sys.country,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 10) / 10,
    description: data.weather[0]?.description ?? "Unknown",
    icon: data.weather[0]?.icon ?? "01d",
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    timestamp: data.dt,
  };
}

// Group forecast items by day and extract daily highs/lows
export function transformForecast(
  data: OpenWeatherForecastResponse
): DayForecast[] {
  // Group forecast items by date
  const dailyData = new Map<
    string,
    {
      items: OpenWeatherForecastItem[];
      date: string;
      timestamp: number;
    }
  >();

  for (const item of data.list) {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyData.has(date)) {
      dailyData.set(date, {
        items: [],
        date,
        timestamp: item.dt,
      });
    }
    dailyData.get(date)?.items.push(item);
  }

  // Transform to DayForecast array, skipping current day, taking next 5 days
  const forecasts: DayForecast[] = [];
  const today = new Date().toISOString().split("T")[0];

  for (const [date, dayData] of dailyData) {
    if (date === today) continue;
    if (forecasts.length >= 4) break;

    const temps = dayData.items.map((i) => i.main.temp);
    const humidities = dayData.items.map((i) => i.main.humidity);
    const winds = dayData.items.map((i) => i.wind.speed);
    const precipitations = dayData.items.map((i) => i.pop * 100);

    // Find the most common weather condition for the day (use midday if available)
    const middayItem =
      dayData.items.find((i) => i.dt_txt.includes("12:00:00")) ||
      dayData.items[Math.floor(dayData.items.length / 2)];

    forecasts.push({
      date: formatDate(dayData.timestamp),
      dayName: getDayName(dayData.timestamp),
      tempHigh: Math.round(Math.max(...temps)),
      tempLow: Math.round(Math.min(...temps)),
      humidity: Math.round(
        humidities.reduce((a, b) => a + b, 0) / humidities.length
      ),
      windSpeed:
        Math.round((winds.reduce((a, b) => a + b, 0) / winds.length) * 10) / 10,
      description: middayItem?.weather[0]?.description ?? "Unknown",
      icon: middayItem?.weather[0]?.icon ?? "01d",
      precipitation: Math.round(Math.max(...precipitations)),
    });
  }

  return forecasts;
}

// Error class for weather API errors
export class WeatherApiError extends Error {
  code: WeatherErrorCode;
  statusCode: number;
  query?: string;

  constructor(
    message: string,
    code: WeatherErrorCode,
    statusCode: number,
    query?: string
  ) {
    super(message);
    this.name = "WeatherApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.query = query;
  }
}

const FETCH_TIMEOUT_MS = 8000;

// Map a non-ok response from OpenWeatherMap to our own error.
// A 404 means the upstream successfully told us the city doesn't exist, so
// that's a caller-facing "not found" — everything else (5xx, unexpected 4xx)
// means the upstream itself is failing, which is on us, not the caller.
function mapUpstreamError(status: number, city: string): WeatherApiError {
  if (status === 404) {
    return new WeatherApiError("City not found", "INVALID_CITY", 404, city);
  }

  if (status === 429) {
    return new WeatherApiError(
      "Too many requests. Please try again later.",
      "RATE_LIMIT",
      429
    );
  }

  if (status === 401 || status === 403) {
    return new WeatherApiError("Invalid API key", "MISSING_API_KEY", status);
  }

  // Upstream dependency failure (5xx or anything else unexpected) — don't
  // leak their raw status/body, and don't pass their status through as ours.
  return new WeatherApiError(
    "Weather service is currently unavailable. Please try again later.",
    "API_ERROR",
    502
  );
}

interface WeatherQuery {
  // The "q=London" or "lat=1&lon=2" portion of the OpenWeatherMap URL.
  params: string;
  // The city name to check/populate in the cache, or null when it isn't
  // known upfront (coordinate lookups only learn the city from the response).
  cacheKey: string | null;
}

async function fetchWeatherByQuery(
  apiKey: string,
  query: WeatherQuery
): Promise<WeatherData> {
  if (query.cacheKey) {
    const cached = weatherCache.get<WeatherData>(query.cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    // Fetch current weather and forecast in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(
        `${OPENWEATHER_BASE_URL}/weather?${query.params}&units=metric&appid=${apiKey}`,
        { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
      ),
      fetch(
        `${OPENWEATHER_BASE_URL}/forecast?${query.params}&units=metric&appid=${apiKey}`,
        { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
      ),
    ]);

    // Handle errors
    if (!currentResponse.ok) {
      throw mapUpstreamError(currentResponse.status, query.cacheKey ?? "");
    }

    if (!forecastResponse.ok) {
      throw mapUpstreamError(forecastResponse.status, query.cacheKey ?? "");
    }

    const currentData =
      (await currentResponse.json()) as OpenWeatherCurrentResponse;
    const forecastData =
      (await forecastResponse.json()) as OpenWeatherForecastResponse;

    const weatherData: WeatherData = {
      current: transformCurrentWeather(currentData),
      forecast: transformForecast(forecastData),
    };

    // Cache under the resolved city name — this also benefits a coordinate
    // lookup's city if it's searched by name afterward.
    weatherCache.set(weatherData.current.city, weatherData);

    return weatherData;
  } catch (error) {
    if (error instanceof WeatherApiError) {
      throw error;
    }

    // AbortSignal.timeout() rejects with a DOMException named "TimeoutError"
    // when the upstream takes too long to respond.
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new WeatherApiError(
        "Weather service timed out. Please try again later.",
        "NETWORK_ERROR",
        504
      );
    }

    // Any other network-level failure (DNS, connection refused, malformed
    // response, etc.) means the upstream is unreachable/failing, not the
    // caller's fault.
    throw new WeatherApiError(
      "Unable to connect to weather service. Please check your internet connection.",
      "NETWORK_ERROR",
      502
    );
  }
}

function requireApiKey(): string {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new WeatherApiError(
      "Weather API key is not configured",
      "MISSING_API_KEY",
      500
    );
  }
  return apiKey;
}

// Fetch weather data from OpenWeatherMap by city name
export async function fetchWeatherData(city: string): Promise<WeatherData> {
  const apiKey = requireApiKey();

  const normalizedCity = city.trim();
  if (!normalizedCity) {
    throw new WeatherApiError(
      "City name cannot be empty",
      "INVALID_CITY",
      400
    );
  }

  return fetchWeatherByQuery(apiKey, {
    params: `q=${encodeURIComponent(normalizedCity)}`,
    cacheKey: normalizedCity,
  });
}

// Fetch weather data from OpenWeatherMap by geographic coordinates (used for
// the "detect my location" feature)
export async function fetchWeatherByCoords(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const apiKey = requireApiKey();

  const isValid =
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  if (!isValid) {
    throw new WeatherApiError("Invalid coordinates", "INVALID_CITY", 400);
  }

  return fetchWeatherByQuery(apiKey, {
    params: `lat=${lat}&lon=${lon}`,
    cacheKey: null,
  });
}

// Check if weather data is cached
export function isWeatherCached(city: string): boolean {
  return weatherCache.has(city);
}
