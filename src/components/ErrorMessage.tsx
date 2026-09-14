"use client";

import type { ReactNode } from "react";
import type { WeatherErrorCode } from "@/types/weather";

interface ErrorMessageProps {
  message: string;
  code: WeatherErrorCode;
  onRetry?: () => void;
}

const errorIcons: Record<WeatherErrorCode, ReactNode> = {
  INVALID_CITY: (
    <svg
      className="w-12 h-12 text-yellow-400"
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
  ),
  RATE_LIMIT: (
    <svg
      className="w-12 h-12 text-orange-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  NETWORK_ERROR: (
    <svg
      className="w-12 h-12 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
      />
    </svg>
  ),
  API_ERROR: (
    <svg
      className="w-12 h-12 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  MISSING_API_KEY: (
    <svg
      className="w-12 h-12 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  ),
  UNKNOWN_ERROR: (
    <svg
      className="w-12 h-12 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const errorTitles: Record<WeatherErrorCode, string> = {
  INVALID_CITY: "City Not Found",
  RATE_LIMIT: "Too Many Requests",
  NETWORK_ERROR: "Connection Error",
  API_ERROR: "Service Error",
  MISSING_API_KEY: "Configuration Error",
  UNKNOWN_ERROR: "Something Went Wrong",
};

export function ErrorMessage({ message, code, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16">
      {/* Error icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-400/20 rounded-full blur-xl" />
        <div className="relative bg-white/10 rounded-full p-4">
          {errorIcons[code]}
        </div>
      </div>

      {/* Error title */}
      <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
        {errorTitles[code]}
      </h3>

      {/* Error message */}
      <p className="text-white/60 text-center max-w-md px-4 mb-6">{message}</p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 min-h-[44px] min-w-[120px]"
        >
          Try Again
        </button>
      )}

      {/* Additional help text for specific errors */}
      {code === "INVALID_CITY" && (
        <p className="text-white/40 text-sm mt-4 text-center px-4">
          Try searching for a different city or check the spelling
        </p>
      )}
      {code === "RATE_LIMIT" && (
        <p className="text-white/40 text-sm mt-4 text-center px-4">
          Please wait a moment before trying again
        </p>
      )}
      {code === "MISSING_API_KEY" && (
        <p className="text-white/40 text-sm mt-4 text-center px-4">
          The weather service is not properly configured. Please contact support.
        </p>
      )}
    </div>
  );
}
