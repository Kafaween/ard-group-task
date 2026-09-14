"use client";

import type { DayForecast } from "@/types/weather";
import { WeatherIcon } from "./WeatherIcon";

interface ForecastCardProps {
  forecast: DayForecast;
}

export function ForecastCard({ forecast }: ForecastCardProps) {
  return (
    <div className="flex-shrink-0 w-[140px] md:w-auto md:flex-1 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-5 hover:bg-white/15 transition-all duration-300">
      {/* Day name */}
      <p className="text-white font-semibold text-center mb-1">
        {forecast.dayName}
      </p>
      <p className="text-white/50 text-xs text-center mb-3">{forecast.date}</p>

      {/* Weather icon */}
      <div className="flex justify-center mb-3">
        <WeatherIcon
          icon={forecast.icon}
          description={forecast.description}
          size="medium"
        />
      </div>

      {/* Description */}
      <p className="text-white/70 text-xs text-center capitalize mb-3 truncate">
        {forecast.description}
      </p>

      {/* Temperature */}
      <div className="flex justify-center items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-white">
          {forecast.tempHigh}°
        </span>
        <span className="text-lg text-white/50">{forecast.tempLow}°</span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs">
        {/* Precipitation — always rendered (even at 0%) so every card has
            the same structure and height */}
        <div className="flex items-center justify-between">
          <span className="text-white/50 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            Rain
          </span>
          <span className="text-blue-300">{forecast.precipitation}%</span>
        </div>

        {/* Humidity */}
        <div className="flex items-center justify-between">
          <span className="text-white/50">Humidity</span>
          <span className="text-white/80">{forecast.humidity}%</span>
        </div>

        {/* Wind */}
        <div className="flex items-center justify-between">
          <span className="text-white/50">Wind</span>
          <span className="text-white/80">{forecast.windSpeed} m/s</span>
        </div>
      </div>
    </div>
  );
}

interface ForecastListProps {
  forecasts: DayForecast[];
}

export function ForecastList({ forecasts }: ForecastListProps) {
  return (
    <div className="mt-6 md:mt-8">
      {/* Horizontal scroll on mobile, grid on larger screens */}
      <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory md:snap-none -mx-4 px-4 md:mx-0 md:px-0">
        {forecasts.map((forecast, index) => (
          <div key={index} className="snap-center">
            <ForecastCard forecast={forecast} />
          </div>
        ))}
      </div>
    </div>
  );
}
