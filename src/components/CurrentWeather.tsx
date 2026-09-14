"use client";

import type { CurrentWeather as CurrentWeatherType } from "@/types/weather";
import { WeatherIcon } from "./WeatherIcon";

interface CurrentWeatherProps {
  weather: CurrentWeatherType;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function CurrentWeather({ weather }: CurrentWeatherProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8">
      {/* Background glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Location */}
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-white/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            {weather.city}, {weather.country}
          </h2>
        </div>

        {/* Date */}
        <p className="text-white/60 text-sm md:text-base mb-4">
          {formatFullDate(weather.timestamp)}
        </p>

        {/* Main weather display */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Weather icon and description */}
          <div className="flex flex-col items-center md:items-start">
            <WeatherIcon
              icon={weather.icon}
              description={weather.description}
              size="hero"
            />
            <p className="mt-4 text-lg md:text-xl text-white/80 capitalize">
              {weather.description}
            </p>
          </div>

          {/* Temperature */}
          <div className="text-center md:text-right">
            <div className="text-7xl md:text-8xl lg:text-9xl font-light text-white tracking-tighter">
              {weather.temperature}
              <span className="text-4xl md:text-5xl align-top">°C</span>
            </div>
            <p className="text-white/60 text-lg mt-2">
              Feels like {weather.feelsLike}°C
            </p>
          </div>
        </div>

        {/* Weather details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Humidity */}
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
              <span className="text-white/60 text-sm">Humidity</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {weather.humidity}%
            </p>
          </div>

          {/* Wind speed */}
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
              <span className="text-white/60 text-sm">Wind</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {weather.windSpeed} m/s
            </p>
          </div>

          {/* Sunrise */}
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="text-white/60 text-sm">Sunrise</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {formatTime(weather.sunrise)}
            </p>
          </div>

          {/* Sunset */}
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
              <span className="text-white/60 text-sm">Sunset</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {formatTime(weather.sunset)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
