/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

const weatherData = {
  current: {
    city: "London",
    country: "GB",
    temperature: 20,
    feelsLike: 19,
    humidity: 65,
    windSpeed: 3.5,
    description: "clear sky",
    icon: "01d",
    sunrise: 1704094800,
    sunset: 1704127200,
    timestamp: 1704110400,
  },
  forecast: [
    {
      date: "Jan 2",
      dayName: "Tue",
      tempHigh: 18,
      tempLow: 10,
      humidity: 70,
      windSpeed: 4.2,
      description: "light rain",
      icon: "10d",
      precipitation: 60,
    },
  ],
};

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

async function searchFor(user: ReturnType<typeof userEvent.setup>, city: string) {
  const input = screen.getByLabelText("Search for a city");
  await user.type(input, city);
  await user.click(screen.getByRole("button", { name: "Search" }));
}

describe("Home page", () => {
  let originalFetch: typeof global.fetch;
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    originalFetch = global.fetch;
    window.localStorage.clear();
    // Most tests aren't about geolocation — keep it unsupported by default
    // so the auto-detect effect is a no-op unless a test opts in.
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
    });
  });

  it("shows the initial empty state before any search", () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [] }));
    render(<Home />);

    expect(
      screen.getByText(
        "Search for a city to see current weather conditions and a 5-day forecast"
      )
    ).toBeInTheDocument();
  });

  it("renders weather data after a successful search", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/weather")) {
        return Promise.resolve(
          jsonResponse({ success: true, data: weatherData, cached: false })
        );
      }
      return Promise.resolve(jsonResponse({ success: true, data: [] }));
    });

    render(<Home />);
    await searchFor(user, "London");

    await waitFor(() => {
      expect(screen.getByText("London, GB")).toBeInTheDocument();
    });
    expect(screen.getByText("Tue")).toBeInTheDocument();
  });

  it("renders an error message when the API responds with a failure", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/weather")) {
        return Promise.resolve(
          jsonResponse({
            success: false,
            error: "City not found",
            code: "INVALID_CITY",
          })
        );
      }
      return Promise.resolve(jsonResponse({ success: true, data: [] }));
    });

    render(<Home />);
    await searchFor(user, "Nowhereville");

    await waitFor(() => {
      expect(screen.getByText("City Not Found")).toBeInTheDocument();
    });
    expect(screen.getByText("City not found")).toBeInTheDocument();
  });

  it("renders a network error message when the fetch throws", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/weather")) {
        return Promise.reject(new Error("network down"));
      }
      return Promise.resolve(jsonResponse({ success: true, data: [] }));
    });

    render(<Home />);
    await searchFor(user, "London");

    await waitFor(() => {
      expect(screen.getByText("Connection Error")).toBeInTheDocument();
    });
  });

  it("retries the last searched city when Try Again is clicked", async () => {
    const user = userEvent.setup();
    let weatherCallCount = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/weather")) {
        weatherCallCount += 1;
        if (weatherCallCount === 1) {
          return Promise.resolve(
            jsonResponse({
              success: false,
              error: "City not found",
              code: "INVALID_CITY",
            })
          );
        }
        return Promise.resolve(
          jsonResponse({ success: true, data: weatherData, cached: false })
        );
      }
      return Promise.resolve(jsonResponse({ success: true, data: [] }));
    });

    render(<Home />);
    await searchFor(user, "London");

    await waitFor(() => {
      expect(screen.getByText("City Not Found")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Try Again" }));

    await waitFor(() => {
      expect(screen.getByText("London, GB")).toBeInTheDocument();
    });
    expect(weatherCallCount).toBe(2);
  });

  describe("geolocation auto-detect on first visit", () => {
    function stubGeolocation(
      onRequest: (
        success: PositionCallback,
        error: PositionErrorCallback
      ) => void
    ) {
      Object.defineProperty(navigator, "geolocation", {
        value: { getCurrentPosition: onRequest },
        configurable: true,
      });
    }

    it("shows local weather automatically when the browser grants location", async () => {
      stubGeolocation((success) => {
        success({
          coords: { latitude: 51.5074, longitude: -0.1278 },
        } as GeolocationPosition);
      });

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/weather")) {
          expect(url).toContain("lat=51.5074");
          expect(url).toContain("lon=-0.1278");
          return Promise.resolve(
            jsonResponse({ success: true, data: weatherData, cached: false })
          );
        }
        return Promise.resolve(jsonResponse({ success: true, data: [] }));
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("London, GB")).toBeInTheDocument();
      });
    });

    it("silently falls back to the initial state when permission is denied", async () => {
      stubGeolocation((_success, error) => {
        error({ code: 1, message: "denied" } as GeolocationPositionError);
      });
      global.fetch = vi
        .fn()
        .mockResolvedValue(jsonResponse({ success: true, data: [] }));

      render(<Home />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Search for a city to see current weather conditions and a 5-day forecast"
          )
        ).toBeInTheDocument();
      });
      // No error banner should appear for a declined/failed auto-detect.
      expect(screen.queryByText("City Not Found")).not.toBeInTheDocument();
    });

    it("silently falls back to the initial state when the fetch itself fails after permission is granted", async () => {
      stubGeolocation((success) => {
        success({
          coords: { latitude: 51.5074, longitude: -0.1278 },
        } as GeolocationPosition);
      });
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/weather")) {
          return Promise.reject(new Error("network down"));
        }
        return Promise.resolve(jsonResponse({ success: true, data: [] }));
      });

      render(<Home />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Search for a city to see current weather conditions and a 5-day forecast"
          )
        ).toBeInTheDocument();
      });
      expect(screen.queryByText("Connection Error")).not.toBeInTheDocument();
    });

    it("silently falls back to the initial state when the API can't resolve the coordinates", async () => {
      stubGeolocation((success) => {
        success({
          coords: { latitude: 0, longitude: 0 },
        } as GeolocationPosition);
      });
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/weather")) {
          return Promise.resolve(
            jsonResponse({
              success: false,
              error: "City not found",
              code: "INVALID_CITY",
            })
          );
        }
        return Promise.resolve(jsonResponse({ success: true, data: [] }));
      });

      render(<Home />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Search for a city to see current weather conditions and a 5-day forecast"
          )
        ).toBeInTheDocument();
      });
      expect(screen.queryByText("City Not Found")).not.toBeInTheDocument();
    });

    it("does not prompt again on a later visit", async () => {
      window.localStorage.setItem("weather-dashboard-geo-attempted", "true");
      const getCurrentPosition = vi.fn();
      stubGeolocation(getCurrentPosition);
      global.fetch = vi
        .fn()
        .mockResolvedValue(jsonResponse({ success: true, data: [] }));

      render(<Home />);

      await waitFor(() => {
        expect(
          screen.getByText("Search for a city to get current weather and forecast")
        ).toBeInTheDocument();
      });
      expect(getCurrentPosition).not.toHaveBeenCalled();
    });

    it("does nothing when geolocation isn't supported by the browser", () => {
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });
      global.fetch = vi
        .fn()
        .mockResolvedValue(jsonResponse({ success: true, data: [] }));

      render(<Home />);

      expect(
        screen.getByText(
          "Search for a city to see current weather conditions and a 5-day forecast"
        )
      ).toBeInTheDocument();
    });
  });
});
