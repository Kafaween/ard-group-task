/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  isGeolocationSupported,
  hasAttemptedGeolocation,
  markGeolocationAttempted,
  getCurrentPosition,
} from "@/lib/geolocation";

describe("geolocation", () => {
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe("isGeolocationSupported", () => {
    it("returns true when navigator.geolocation exists", () => {
      Object.defineProperty(navigator, "geolocation", {
        value: {},
        configurable: true,
      });
      expect(isGeolocationSupported()).toBe(true);
    });

    it("returns false when navigator.geolocation is absent", () => {
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });
      expect(isGeolocationSupported()).toBe(false);
    });
  });

  describe("hasAttemptedGeolocation / markGeolocationAttempted", () => {
    it("returns false before anything is marked", () => {
      expect(hasAttemptedGeolocation()).toBe(false);
    });

    it("returns true after marking", () => {
      markGeolocationAttempted();
      expect(hasAttemptedGeolocation()).toBe(true);
    });

    it("does not throw when localStorage access fails", () => {
      const spy = vi
        .spyOn(Object.getPrototypeOf(window.localStorage), "getItem")
        .mockImplementation(() => {
          throw new Error("blocked");
        });

      expect(hasAttemptedGeolocation()).toBe(false);
      spy.mockRestore();
    });
  });

  describe("getCurrentPosition", () => {
    it("resolves with latitude/longitude on success", async () => {
      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition: (success: PositionCallback) => {
            success({
              coords: { latitude: 51.5074, longitude: -0.1278 },
            } as GeolocationPosition);
          },
        },
        configurable: true,
      });

      await expect(getCurrentPosition()).resolves.toEqual({
        latitude: 51.5074,
        longitude: -0.1278,
      });
    });

    it("rejects when the user denies permission", async () => {
      const permissionError = { code: 1, message: "User denied Geolocation" };
      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition: (
            _success: PositionCallback,
            error: PositionErrorCallback
          ) => {
            error(permissionError as GeolocationPositionError);
          },
        },
        configurable: true,
      });

      await expect(getCurrentPosition()).rejects.toEqual(permissionError);
    });
  });
});
