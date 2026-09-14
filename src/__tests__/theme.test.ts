/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  THEME_STORAGE_KEY,
  getStoredTheme,
  setStoredTheme,
  getSystemTheme,
  resolveInitialTheme,
  applyTheme,
  getInitThemeScript,
} from "@/lib/theme";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getStoredTheme / setStoredTheme", () => {
    it("returns null when nothing is stored", () => {
      expect(getStoredTheme()).toBeNull();
    });

    it("round-trips a stored theme", () => {
      setStoredTheme("dark");
      expect(getStoredTheme()).toBe("dark");

      setStoredTheme("light");
      expect(getStoredTheme()).toBe("light");
    });

    it("ignores a garbage value already in storage", () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "not-a-theme");
      expect(getStoredTheme()).toBeNull();
    });

    it("does not throw when localStorage access fails", () => {
      const spy = vi
        .spyOn(Object.getPrototypeOf(window.localStorage), "getItem")
        .mockImplementation(() => {
          throw new Error("blocked");
        });

      expect(getStoredTheme()).toBeNull();
      spy.mockRestore();
    });
  });

  describe("getSystemTheme", () => {
    it("returns dark when the OS prefers dark", () => {
      mockMatchMedia(true);
      expect(getSystemTheme()).toBe("dark");
    });

    it("returns light when the OS does not prefer dark", () => {
      mockMatchMedia(false);
      expect(getSystemTheme()).toBe("light");
    });
  });

  describe("resolveInitialTheme", () => {
    it("prefers a stored theme over the system preference", () => {
      mockMatchMedia(true); // system says dark
      setStoredTheme("light"); // but the user chose light before

      expect(resolveInitialTheme()).toBe("light");
    });

    it("falls back to the system preference when nothing is stored", () => {
      mockMatchMedia(true);
      expect(resolveInitialTheme()).toBe("dark");
    });
  });

  describe("applyTheme", () => {
    it("adds the dark class to <html> for dark", () => {
      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes the dark class from <html> for light", () => {
      document.documentElement.classList.add("dark");
      applyTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("getInitThemeScript", () => {
    it("embeds the storage key and is valid, self-invoking JS", () => {
      const script = getInitThemeScript();
      expect(script).toContain(THEME_STORAGE_KEY);
      expect(() => new Function(script)).not.toThrow();
    });

    it("applies the dark class when executed with a stored dark theme", () => {
      setStoredTheme("dark");
      new Function(getInitThemeScript())();
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("does not apply the dark class when executed with a stored light theme", () => {
      setStoredTheme("light");
      new Function(getInitThemeScript())();
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("falls back to the system preference when executed with nothing stored", () => {
      mockMatchMedia(true);
      new Function(getInitThemeScript())();
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});
