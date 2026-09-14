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

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
});
