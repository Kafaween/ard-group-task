import { NextRequest, NextResponse } from "next/server";
import {
  fetchWeatherData,
  isWeatherCached,
  WeatherApiError,
} from "@/lib/weather-service";
import { getDatabase } from "@/lib/database";
import { isValidCityName } from "@/lib/validation";
import type { WeatherApiResponse } from "@/types/weather";

export async function GET(
  request: NextRequest
): Promise<NextResponse<WeatherApiResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get("city");

  if (!city || !city.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: "City parameter is required",
        code: "INVALID_CITY",
      },
      { status: 400 }
    );
  }

  const normalizedCity = city.trim();

  if (!isValidCityName(normalizedCity)) {
    return NextResponse.json(
      {
        success: false,
        error: "City name can only contain letters, spaces, hyphens, apostrophes, and periods",
        code: "INVALID_CITY",
      },
      { status: 400 }
    );
  }

  try {
    // Check if data is cached before fetching
    const wasCached = isWeatherCached(normalizedCity);

    // Fetch weather data (will use cache if available)
    const data = await fetchWeatherData(normalizedCity);

    // Save to recent searches (only if not cached to avoid duplicate entries)
    if (!wasCached) {
      try {
        const db = getDatabase();
        db.addSearch(data.current.city);
      } catch (dbError) {
        // Log but don't fail the request if database has issues
        console.error("Failed to save recent search:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      data,
      cached: wasCached,
    });
  } catch (error) {
    if (error instanceof WeatherApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          ...(error.query ? { query: error.query } : {}),
        },
        { status: error.statusCode }
      );
    }

    // Unexpected error
    console.error("Unexpected error fetching weather:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
