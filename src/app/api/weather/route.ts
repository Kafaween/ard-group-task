import { NextRequest, NextResponse } from "next/server";
import {
  fetchWeatherData,
  fetchWeatherByCoords,
  isWeatherCached,
  WeatherApiError,
} from "@/lib/weather-service";
import { getDatabase } from "@/lib/database";
import { isValidCityName } from "@/lib/validation";
import type { WeatherApiResponse, WeatherData } from "@/types/weather";

function handleWeatherError(error: unknown): NextResponse<WeatherApiResponse> {
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

function saveRecentSearch(city: string): void {
  try {
    const db = getDatabase();
    db.addSearch(city);
  } catch (dbError) {
    // Log but don't fail the request if the database has issues
    console.error("Failed to save recent search:", dbError);
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<WeatherApiResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get("city");
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  // Geolocation-based lookup (used for the "detect my location" feature)
  if (latParam !== null && lonParam !== null) {
    const lat = Number(latParam);
    const lon = Number(lonParam);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coordinates",
          code: "INVALID_CITY",
        },
        { status: 400 }
      );
    }

    try {
      const data: WeatherData = await fetchWeatherByCoords(lat, lon);
      saveRecentSearch(data.current.city);

      return NextResponse.json({
        success: true,
        data,
        cached: false,
      });
    } catch (error) {
      return handleWeatherError(error);
    }
  }

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
      saveRecentSearch(data.current.city);
    }

    return NextResponse.json({
      success: true,
      data,
      cached: wasCached,
    });
  } catch (error) {
    return handleWeatherError(error);
  }
}
