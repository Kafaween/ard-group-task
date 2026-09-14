import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetRecentSearches = vi.fn();
const mockSearchCities = vi.fn();

vi.mock("@/lib/database", () => ({
  getDatabase: vi.fn(() => ({
    getRecentSearches: mockGetRecentSearches,
    searchCities: mockSearchCities,
  })),
}));

import { GET } from "@/app/api/searches/route";

describe("Searches API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recent searches when there is no query", async () => {
    mockGetRecentSearches.mockReturnValue([
      { id: 1, city: "London", searchedAt: "2026-01-01" },
    ]);

    const request = new NextRequest("http://localhost:3000/api/searches");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(mockGetRecentSearches).toHaveBeenCalledWith(5);
    expect(mockSearchCities).not.toHaveBeenCalled();
  });

  it("returns matching cities when a query is provided", async () => {
    mockSearchCities.mockReturnValue([
      { id: 2, city: "London", searchedAt: "2026-01-01" },
    ]);

    const request = new NextRequest(
      "http://localhost:3000/api/searches?q=lon"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSearchCities).toHaveBeenCalledWith("lon", 5);
    expect(mockGetRecentSearches).not.toHaveBeenCalled();
  });

  it("returns an empty list instead of failing when the database throws", async () => {
    mockGetRecentSearches.mockImplementation(() => {
      throw new Error("database is locked");
    });

    const request = new NextRequest("http://localhost:3000/api/searches");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });
});
