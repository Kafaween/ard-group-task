import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import type { RecentSearchesResponse } from "@/types/weather";

export async function GET(
  request: NextRequest
): Promise<NextResponse<RecentSearchesResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";

  try {
    const db = getDatabase();
    const searches = query
      ? db.searchCities(query, 5)
      : db.getRecentSearches(5);

    return NextResponse.json({
      success: true,
      data: searches,
    });
  } catch (error) {
    console.error("Failed to fetch recent searches:", error);

    // Return empty array on error to not break the UI
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}
