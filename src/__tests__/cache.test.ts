import { describe, it, expect, beforeEach, vi } from "vitest";
import { WeatherCache, CACHE_TTL } from "@/lib/cache";

describe("WeatherCache", () => {
  let cache: WeatherCache;

  beforeEach(() => {
    cache = new WeatherCache();
    vi.useFakeTimers();
  });

  describe("set and get", () => {
    it("should store and retrieve data correctly", () => {
      const testData = { temperature: 25, city: "London" };
      cache.set("London", testData);

      const result = cache.get("London");
      expect(result).toEqual(testData);
    });

    it("should normalize city names (case-insensitive)", () => {
      const testData = { temperature: 30, city: "Paris" };
      cache.set("PARIS", testData);

      expect(cache.get("paris")).toEqual(testData);
      expect(cache.get("Paris")).toEqual(testData);
      expect(cache.get("PARIS")).toEqual(testData);
    });

    it("should trim whitespace from city names", () => {
      const testData = { temperature: 20, city: "Berlin" };
      cache.set("  Berlin  ", testData);

      expect(cache.get("Berlin")).toEqual(testData);
      expect(cache.get(" berlin ")).toEqual(testData);
    });

    it("should return null for non-existent entries", () => {
      const result = cache.get("NonExistentCity");
      expect(result).toBeNull();
    });
  });

  describe("cache expiration", () => {
    it("should return data within TTL period", () => {
      const testData = { temperature: 22, city: "Tokyo" };
      cache.set("Tokyo", testData);

      // Advance time by 5 minutes (within 10-minute TTL)
      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(cache.get("Tokyo")).toEqual(testData);
    });

    it("should return null after TTL expires", () => {
      const testData = { temperature: 22, city: "Tokyo" };
      cache.set("Tokyo", testData);

      // Advance time by 10 minutes + 1ms (past TTL)
      vi.advanceTimersByTime(CACHE_TTL + 1);

      expect(cache.get("Tokyo")).toBeNull();
    });

    it("should automatically clean up expired entries on get", () => {
      const testData = { temperature: 22, city: "Sydney" };
      cache.set("Sydney", testData);

      expect(cache.size()).toBe(1);

      // Advance time past TTL
      vi.advanceTimersByTime(CACHE_TTL + 1);

      // Calling get should remove expired entry
      cache.get("Sydney");
      expect(cache.size()).toBe(0);
    });
  });

  describe("has", () => {
    it("should return true for existing non-expired entries", () => {
      cache.set("Madrid", { temperature: 28 });
      expect(cache.has("Madrid")).toBe(true);
    });

    it("should return false for non-existent entries", () => {
      expect(cache.has("NonExistent")).toBe(false);
    });

    it("should return false for expired entries", () => {
      cache.set("Madrid", { temperature: 28 });
      vi.advanceTimersByTime(CACHE_TTL + 1);
      expect(cache.has("Madrid")).toBe(false);
    });
  });

  describe("delete", () => {
    it("should remove entries from cache", () => {
      cache.set("Rome", { temperature: 25 });
      expect(cache.has("Rome")).toBe(true);

      const deleted = cache.delete("Rome");
      expect(deleted).toBe(true);
      expect(cache.has("Rome")).toBe(false);
    });

    it("should return false when deleting non-existent entry", () => {
      const deleted = cache.delete("NonExistent");
      expect(deleted).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all entries from cache", () => {
      cache.set("City1", { temp: 20 });
      cache.set("City2", { temp: 25 });
      cache.set("City3", { temp: 30 });

      expect(cache.size()).toBe(3);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe("getEntryTimestamp and getEntryExpiresAt", () => {
    it("should return correct timestamps", () => {
      const now = Date.now();
      vi.setSystemTime(now);

      cache.set("Vienna", { temperature: 18 });

      expect(cache.getEntryTimestamp("Vienna")).toBe(now);
      expect(cache.getEntryExpiresAt("Vienna")).toBe(now + CACHE_TTL);
    });

    it("should return null for non-existent entries", () => {
      expect(cache.getEntryTimestamp("NonExistent")).toBeNull();
      expect(cache.getEntryExpiresAt("NonExistent")).toBeNull();
    });
  });
});
