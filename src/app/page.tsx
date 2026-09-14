"use client";

import { useState, useCallback } from "react";
import {
  SearchBar,
  CurrentWeather,
  ForecastList,
  WeatherSkeleton,
  InitialState,
  ErrorMessage,
  ThemeToggle,
} from "@/components";
import type {
  WeatherData,
  WeatherApiResponse,
  WeatherErrorCode,
} from "@/types/weather";

interface ErrorState {
  message: string;
  code: WeatherErrorCode;
}

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastSearchedCity, setLastSearchedCity] = useState<string>("");

  const fetchWeather = useCallback(async (city: string) => {
    setIsLoading(true);
    setError(null);
    setLastSearchedCity(city);

    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(city)}`
      );
      const data: WeatherApiResponse = await response.json();

      if (data.success) {
        setWeatherData(data.data);
      } else {
        setError({
          message: data.error,
          code: data.code,
        });
        setWeatherData(null);
      }
    } catch (err) {
      console.error("Failed to fetch weather:", err);
      setError({
        message: "Failed to connect to the server. Please try again.",
        code: "NETWORK_ERROR",
      });
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastSearchedCity) {
      fetchWeather(lastSearchedCity);
    }
  }, [lastSearchedCity, fetchWeather]);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,#4fb3e8_0%,#1c7bd4_22%,#0e5bb8_42%,#0a3d84_62%,#062458_82%,#020e2e_100%)] dark:bg-[radial-gradient(ellipse_at_top,#25406b_0%,#17304f_22%,#0f2038_42%,#0a1730_62%,#060f22_82%,#01050c_100%)]">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300/10 dark:bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 dark:bg-slate-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 lg:py-16">
        {/* Header */}
        <header className="relative text-center mb-8 md:mb-12">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Weather Dashboard
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Search for a city to get current weather and forecast
          </p>
        </header>

        {/* Search bar */}
        <div className="mb-8 md:mb-12">
          <SearchBar onSearch={fetchWeather} isLoading={isLoading} />
        </div>

        {/* Main content area */}
        <div className="max-w-5xl mx-auto">
          {/* Loading state */}
          {isLoading && <WeatherSkeleton />}

          {/* Error state */}
          {!isLoading && error && (
            <ErrorMessage
              message={error.message}
              code={error.code}
              onRetry={handleRetry}
            />
          )}

          {/* Weather data */}
          {!isLoading && !error && weatherData && (
            <>
              <CurrentWeather weather={weatherData.current} />
              <ForecastList forecasts={weatherData.forecast} />
            </>
          )}

          {/* Initial state */}
          {!isLoading && !error && !weatherData && <InitialState />}
        </div>
      </div>
    </main>
  );
}
