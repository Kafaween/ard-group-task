import type { CacheEntry } from "@/types/weather";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

class WeatherCache {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  private normalizeKey(city: string): string {
    return city.toLowerCase().trim();
  }

  get<T>(city: string): T | null {
    const key = this.normalizeKey(city);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(city: string, data: T): void {
    const key = this.normalizeKey(city);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS,
    };

    this.cache.set(key, entry);
  }

  has(city: string): boolean {
    const key = this.normalizeKey(city);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(city: string): boolean {
    const key = this.normalizeKey(city);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // For testing purposes
  getEntryTimestamp(city: string): number | null {
    const key = this.normalizeKey(city);
    const entry = this.cache.get(key);
    return entry ? entry.timestamp : null;
  }

  getEntryExpiresAt(city: string): number | null {
    const key = this.normalizeKey(city);
    const entry = this.cache.get(key);
    return entry ? entry.expiresAt : null;
  }

  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const weatherCache = new WeatherCache();

// Export class for testing
export { WeatherCache };

// Export cache TTL for reference
export const CACHE_TTL = CACHE_TTL_MS;
