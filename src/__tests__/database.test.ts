import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SearchDatabase, getDatabase } from "@/lib/database";

describe("SearchDatabase", () => {
  let db: SearchDatabase;

  beforeEach(() => {
    db = new SearchDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  describe("addSearch and getRecentSearches", () => {
    it("stores a search and returns it in recent searches", () => {
      db.addSearch("London");

      const results = db.getRecentSearches();
      expect(results).toHaveLength(1);
      expect(results[0].city).toBe("London");
    });

    it("ignores empty or whitespace-only city names", () => {
      db.addSearch("");
      db.addSearch("   ");

      expect(db.getRecentSearches()).toHaveLength(0);
    });

    it("trims whitespace from the city name before storing", () => {
      db.addSearch("  Paris  ");

      const results = db.getRecentSearches();
      expect(results[0].city).toBe("Paris");
    });

    it("moves a re-searched city to the top instead of duplicating it", () => {
      db.addSearch("London");
      db.addSearch("Paris");
      db.addSearch("London");

      const results = db.getRecentSearches();
      expect(results).toHaveLength(2);
      expect(results[0].city).toBe("London");
    });

    it("treats city names as case-insensitive for deduping", () => {
      db.addSearch("london");
      db.addSearch("LONDON");

      const results = db.getRecentSearches();
      expect(results).toHaveLength(1);
    });

    it("keeps only the 5 most recent searches", () => {
      db.addSearch("City1");
      db.addSearch("City2");
      db.addSearch("City3");
      db.addSearch("City4");
      db.addSearch("City5");
      db.addSearch("City6");

      const results = db.getRecentSearches(10);
      expect(results).toHaveLength(5);
      expect(results.map((r) => r.city)).not.toContain("City1");
      expect(results.map((r) => r.city)).toContain("City6");
    });

    it("respects a custom limit", () => {
      db.addSearch("City1");
      db.addSearch("City2");
      db.addSearch("City3");

      expect(db.getRecentSearches(2)).toHaveLength(2);
    });

    it("returns an empty array when there are no searches", () => {
      expect(db.getRecentSearches()).toEqual([]);
    });
  });

  describe("searchCities", () => {
    beforeEach(() => {
      db.addSearch("London");
      db.addSearch("Los Angeles");
      db.addSearch("Paris");
    });

    it("returns cities matching a substring, case-insensitively", () => {
      const results = db.searchCities("lo");
      expect(results.map((r) => r.city).sort()).toEqual(
        ["London", "Los Angeles"].sort()
      );
    });

    it("returns recent searches when the query is empty", () => {
      const results = db.searchCities("");
      expect(results).toHaveLength(3);
    });

    it("returns recent searches when the query is whitespace-only", () => {
      const results = db.searchCities("   ");
      expect(results).toHaveLength(3);
    });

    it("returns an empty array when nothing matches", () => {
      expect(db.searchCities("Zzzzz")).toEqual([]);
    });

    it("respects a custom limit", () => {
      db.addSearch("Londonderry");
      const results = db.searchCities("lon", 1);
      expect(results).toHaveLength(1);
    });
  });

  describe("clearSearches", () => {
    it("removes all stored searches", () => {
      db.addSearch("London");
      db.addSearch("Paris");
      expect(db.getRecentSearches()).toHaveLength(2);

      db.clearSearches();
      expect(db.getRecentSearches()).toHaveLength(0);
    });
  });

  describe("getDatabase", () => {
    it("returns the same singleton instance across calls", () => {
      expect(getDatabase()).toBe(getDatabase());
    });
  });
});
