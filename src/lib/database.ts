import { DatabaseSync } from "node:sqlite";
import type { RecentSearch } from "@/types/weather";

const DB_PATH = process.env.NODE_ENV === "test" ? ":memory:" : "./weather.db";

interface SearchRow {
  id: number;
  city: string;
  searched_at: string;
}

class SearchDatabase {
  private db: DatabaseSync;
  private initialized: boolean = false;

  constructor(dbPath: string = DB_PATH) {
    this.db = new DatabaseSync(dbPath);
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recent_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT NOT NULL UNIQUE COLLATE NOCASE,
        searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_searched_at ON recent_searches(searched_at DESC)
    `);

    this.initialized = true;
  }

  addSearch(city: string): void {
    const normalizedCity = city.trim();
    if (!normalizedCity) return;

    // Use INSERT OR REPLACE to update timestamp if city already exists
    // First, delete existing entry (if any) to ensure AUTOINCREMENT gives new id
    this.db
      .prepare("DELETE FROM recent_searches WHERE LOWER(city) = LOWER(?)")
      .run(normalizedCity);

    // Insert the new entry
    this.db
      .prepare("INSERT INTO recent_searches (city) VALUES (?)")
      .run(normalizedCity);

    // Keep only the last 5 searches
    this.db.exec(`
      DELETE FROM recent_searches
      WHERE id NOT IN (
        SELECT id FROM recent_searches
        ORDER BY searched_at DESC, id DESC
        LIMIT 5
      )
    `);
  }

  getRecentSearches(limit: number = 5): RecentSearch[] {
    const stmt = this.db.prepare(
      "SELECT id, city, searched_at FROM recent_searches ORDER BY searched_at DESC, id DESC LIMIT ?"
    );
    const results = stmt.all(limit) as unknown as SearchRow[];

    return results.map((row: SearchRow) => ({
      id: row.id,
      city: row.city,
      searchedAt: row.searched_at,
    }));
  }

  searchCities(query: string, limit: number = 5): RecentSearch[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.getRecentSearches(limit);
    }

    const stmt = this.db.prepare(
      `SELECT id, city, searched_at FROM recent_searches
       WHERE LOWER(city) LIKE ?
       ORDER BY searched_at DESC, id DESC
       LIMIT ?`
    );
    const results = stmt.all(
      `%${normalizedQuery}%`,
      limit
    ) as unknown as SearchRow[];

    return results.map((row: SearchRow) => ({
      id: row.id,
      city: row.city,
      searchedAt: row.searched_at,
    }));
  }

  clearSearches(): void {
    this.db.exec("DELETE FROM recent_searches");
  }

  close(): void {
    this.db.close();
  }
}

// Singleton instance for the application
let dbInstance: SearchDatabase | null = null;

export function getDatabase(): SearchDatabase {
  if (!dbInstance) {
    dbInstance = new SearchDatabase();
  }
  return dbInstance;
}

// Export class for testing
export { SearchDatabase };
