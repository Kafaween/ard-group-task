// OpenWeatherMap API Response Types

export interface OpenWeatherCurrentResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface OpenWeatherForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  visibility: number;
  pop: number;
  rain?: {
    "3h"?: number;
  };
  snow?: {
    "3h"?: number;
  };
  sys: {
    pod: string;
  };
  dt_txt: string;
}

export interface OpenWeatherForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: OpenWeatherForecastItem[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

// Internal/Transformed Types

export interface CurrentWeather {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  timestamp: number;
}

export interface DayForecast {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  precipitation: number;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: DayForecast[];
}

// API Response Types

export interface WeatherApiSuccessResponse {
  success: true;
  data: WeatherData;
  cached: boolean;
}

export interface WeatherApiErrorResponse {
  success: false;
  error: string;
  code: WeatherErrorCode;
  query?: string;
}

export type WeatherApiResponse = WeatherApiSuccessResponse | WeatherApiErrorResponse;

export type WeatherErrorCode =
  | "INVALID_CITY"
  | "RATE_LIMIT"
  | "NETWORK_ERROR"
  | "API_ERROR"
  | "MISSING_API_KEY"
  | "UNKNOWN_ERROR";

// Recent Searches Types

export interface RecentSearch {
  id: number;
  city: string;
  searchedAt: string;
}

export interface RecentSearchesResponse {
  success: true;
  data: RecentSearch[];
}

// Cache Types

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}
