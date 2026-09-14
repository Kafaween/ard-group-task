const GEO_ATTEMPTED_KEY = "weather-dashboard-geo-attempted";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
}

// Tracks whether we've ever tried to auto-detect the user's location, so we
// only do it once (on their first visit) instead of prompting every time.
export function hasAttemptedGeolocation(): boolean {
  try {
    return window.localStorage.getItem(GEO_ATTEMPTED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markGeolocationAttempted(): void {
  try {
    window.localStorage.setItem(GEO_ATTEMPTED_KEY, "true");
  } catch {
    // Ignore storage failures — worst case we ask again next visit.
  }
}

export function getCurrentPosition(
  options?: PositionOptions
): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      options
    );
  });
}
