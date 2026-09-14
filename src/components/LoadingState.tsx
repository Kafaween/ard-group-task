"use client";

export function LoadingSpinner({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  const sizeClasses = {
    small: "w-5 h-5",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center">
      <svg
        className={`${sizeClasses[size]} text-white animate-spin`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function WeatherSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Current weather skeleton */}
      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 md:p-8 mb-6">
        {/* Location */}
        <div className="h-6 bg-white/20 rounded-lg w-48 mb-6" />

        {/* Main display */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Icon placeholder */}
          <div className="flex flex-col items-center md:items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/20 rounded-full" />
            <div className="h-5 bg-white/20 rounded-lg w-32 mt-4" />
          </div>

          {/* Temperature placeholder */}
          <div className="text-center md:text-right">
            <div className="h-24 md:h-32 bg-white/20 rounded-lg w-48" />
            <div className="h-5 bg-white/20 rounded-lg w-32 mt-2 ml-auto" />
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-4">
              <div className="h-4 bg-white/20 rounded w-20 mb-2" />
              <div className="h-8 bg-white/20 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Forecast skeleton */}
      <div>
        <div className="h-6 bg-white/20 rounded-lg w-40 mb-6" />
        <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[140px] md:w-auto md:flex-1 bg-white/10 rounded-2xl p-4 md:p-5"
            >
              <div className="h-5 bg-white/20 rounded w-12 mx-auto mb-2" />
              <div className="h-3 bg-white/20 rounded w-16 mx-auto mb-3" />
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3" />
              <div className="h-3 bg-white/20 rounded w-20 mx-auto mb-3" />
              <div className="h-8 bg-white/20 rounded w-24 mx-auto mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-white/20 rounded" />
                <div className="h-3 bg-white/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InitialState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24">
      {/* Decorative weather illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full blur-2xl absolute inset-0" />
        <svg
          className="w-32 h-32 md:w-40 md:h-40 text-white/50 relative z-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
      </div>

      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
        Weather Dashboard
      </h2>
      <p className="text-white/60 text-center max-w-md px-4">
        Search for a city to see current weather conditions and a 5-day forecast
      </p>
    </div>
  );
}
