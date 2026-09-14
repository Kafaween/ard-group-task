"use client";

interface WeatherIconProps {
  icon: string;
  description: string;
  size?: "small" | "medium" | "large" | "hero";
  className?: string;
}

// Map OpenWeatherMap icon codes to visual representations
const iconMap: Record<string, { gradient: string; symbol: string }> = {
  // Clear sky
  "01d": {
    gradient: "from-yellow-300 via-orange-400 to-yellow-500",
    symbol: "sun",
  },
  "01n": {
    gradient: "from-slate-400 via-slate-500 to-slate-600",
    symbol: "moon",
  },
  // Few clouds
  "02d": {
    gradient: "from-yellow-300 via-orange-400 to-yellow-500",
    symbol: "sun-cloud",
  },
  "02n": {
    gradient: "from-slate-400 via-slate-500 to-slate-600",
    symbol: "moon-cloud",
  },
  // Scattered clouds
  "03d": { gradient: "from-gray-300 via-gray-400 to-gray-500", symbol: "cloud" },
  "03n": { gradient: "from-gray-400 via-gray-500 to-gray-600", symbol: "cloud" },
  // Broken clouds
  "04d": {
    gradient: "from-gray-400 via-gray-500 to-gray-600",
    symbol: "clouds",
  },
  "04n": {
    gradient: "from-gray-500 via-gray-600 to-gray-700",
    symbol: "clouds",
  },
  // Shower rain
  "09d": { gradient: "from-blue-400 via-blue-500 to-blue-600", symbol: "rain" },
  "09n": { gradient: "from-blue-500 via-blue-600 to-blue-700", symbol: "rain" },
  // Rain
  "10d": {
    gradient: "from-blue-400 via-blue-500 to-blue-600",
    symbol: "sun-rain",
  },
  "10n": {
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    symbol: "moon-rain",
  },
  // Thunderstorm
  "11d": {
    gradient: "from-purple-400 via-purple-500 to-purple-600",
    symbol: "thunder",
  },
  "11n": {
    gradient: "from-purple-500 via-purple-600 to-purple-700",
    symbol: "thunder",
  },
  // Snow
  "13d": {
    gradient: "from-blue-200 via-blue-300 to-blue-400",
    symbol: "snow",
  },
  "13n": {
    gradient: "from-blue-300 via-blue-400 to-blue-500",
    symbol: "snow",
  },
  // Mist
  "50d": { gradient: "from-gray-300 via-gray-400 to-gray-500", symbol: "mist" },
  "50n": { gradient: "from-gray-400 via-gray-500 to-gray-600", symbol: "mist" },
};

const sizeClasses = {
  small: "w-10 h-10",
  medium: "w-16 h-16",
  large: "w-24 h-24",
  hero: "w-32 h-32 md:w-40 md:h-40",
};

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Sun rays */}
      {[...Array(8)].map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="8"
          x2="50"
          y2="18"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${i * 45} 50 50)`}
          className="opacity-80"
        />
      ))}
      {/* Sun center */}
      <circle
        cx="50"
        cy="50"
        r="22"
        fill="currentColor"
        className="drop-shadow-lg"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <path
        d="M50 15C35 15 22 28 22 50C22 72 35 85 57 85C72 85 85 72 85 57C75 65 60 62 52 52C44 42 47 27 57 17C55 16 52 15 50 15Z"
        fill="currentColor"
        className="drop-shadow-lg"
      />
    </svg>
  );
}

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <path
        d="M75 70H30C20 70 15 62 15 55C15 48 20 42 30 42C30 30 40 20 55 20C70 20 80 32 80 45C88 47 92 54 92 60C92 66 88 70 80 70H75Z"
        fill="currentColor"
        className="drop-shadow-lg"
      />
    </svg>
  );
}

function RainDrops({ className }: { className?: string }) {
  return (
    <g className={className}>
      <line
        x1="30"
        y1="75"
        x2="25"
        y2="90"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="animate-pulse"
      />
      <line
        x1="50"
        y1="75"
        x2="45"
        y2="90"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="animate-pulse"
        style={{ animationDelay: "0.2s" }}
      />
      <line
        x1="70"
        y1="75"
        x2="65"
        y2="90"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="animate-pulse"
        style={{ animationDelay: "0.4s" }}
      />
    </g>
  );
}

function SnowFlakes({ className }: { className?: string }) {
  return (
    <g className={className}>
      <circle cx="30" cy="82" r="4" fill="currentColor" className="animate-bounce" />
      <circle
        cx="50"
        cy="88"
        r="4"
        fill="currentColor"
        className="animate-bounce"
        style={{ animationDelay: "0.2s" }}
      />
      <circle
        cx="70"
        cy="82"
        r="4"
        fill="currentColor"
        className="animate-bounce"
        style={{ animationDelay: "0.4s" }}
      />
    </g>
  );
}

function ThunderBolt({ className }: { className?: string }) {
  return (
    <path
      d="M55 65L48 78H55L50 95L65 75H56L62 65H55Z"
      fill="currentColor"
      className={`${className} animate-pulse`}
    />
  );
}

export function WeatherIcon({
  icon,
  description,
  size = "medium",
  className = "",
}: WeatherIconProps) {
  const iconData = iconMap[icon] || iconMap["01d"];
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`relative ${sizeClass} ${className}`}
      role="img"
      aria-label={description}
    >
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${iconData.gradient} opacity-30 blur-xl`}
      />
      <div
        className={`relative w-full h-full bg-gradient-to-br ${iconData.gradient} rounded-full p-2 shadow-lg`}
      >
        {iconData.symbol === "sun" && (
          <SunIcon className="w-full h-full text-yellow-100" />
        )}
        {iconData.symbol === "moon" && (
          <MoonIcon className="w-full h-full text-slate-200" />
        )}
        {iconData.symbol === "cloud" && (
          <CloudIcon className="w-full h-full text-white" />
        )}
        {iconData.symbol === "clouds" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <CloudIcon className="w-full h-full text-gray-300" />
            <g transform="translate(10, 10) scale(0.7)">
              <CloudIcon className="text-white" />
            </g>
          </svg>
        )}
        {iconData.symbol === "sun-cloud" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <g transform="translate(-5, -10) scale(0.6)">
              <SunIcon className="text-yellow-100" />
            </g>
            <g transform="translate(5, 15) scale(0.8)">
              <CloudIcon className="text-white" />
            </g>
          </svg>
        )}
        {iconData.symbol === "moon-cloud" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <g transform="translate(-5, -10) scale(0.6)">
              <MoonIcon className="text-slate-200" />
            </g>
            <g transform="translate(5, 15) scale(0.8)">
              <CloudIcon className="text-white" />
            </g>
          </svg>
        )}
        {iconData.symbol === "rain" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <g transform="translate(0, -10) scale(0.85)">
              <CloudIcon className="text-gray-300" />
            </g>
            <RainDrops className="text-blue-200" />
          </svg>
        )}
        {iconData.symbol === "sun-rain" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <g transform="translate(-10, -15) scale(0.5)">
              <SunIcon className="text-yellow-100" />
            </g>
            <g transform="translate(5, 0) scale(0.75)">
              <CloudIcon className="text-gray-300" />
            </g>
            <RainDrops className="text-blue-200" />
          </svg>
        )}
        {iconData.symbol === "moon-rain" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <g transform="translate(-10, -15) scale(0.5)">
              <MoonIcon className="text-slate-200" />
            </g>
            <g transform="translate(5, 0) scale(0.75)">
              <CloudIcon className="text-gray-300" />
            </g>
            <RainDrops className="text-blue-200" />
          </svg>
        )}
        {iconData.symbol === "thunder" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <g transform="translate(0, -15) scale(0.85)">
              <CloudIcon className="text-gray-400" />
            </g>
            <ThunderBolt className="text-yellow-300" />
          </svg>
        )}
        {iconData.symbol === "snow" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <g transform="translate(0, -10) scale(0.85)">
              <CloudIcon className="text-gray-300" />
            </g>
            <SnowFlakes className="text-white" />
          </svg>
        )}
        {iconData.symbol === "mist" && (
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <line
              x1="20"
              y1="35"
              x2="80"
              y2="35"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-gray-300 opacity-80"
            />
            <line
              x1="25"
              y1="50"
              x2="75"
              y2="50"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-gray-300 opacity-60"
            />
            <line
              x1="30"
              y1="65"
              x2="70"
              y2="65"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-gray-300 opacity-40"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
