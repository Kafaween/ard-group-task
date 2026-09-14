/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurrentWeather } from "@/components/CurrentWeather";
import type { CurrentWeather as CurrentWeatherType } from "@/types/weather";

const weather: CurrentWeatherType = {
  city: "London",
  country: "GB",
  temperature: 21,
  feelsLike: 19,
  humidity: 65,
  windSpeed: 3.5,
  description: "clear sky",
  icon: "01d",
  sunrise: 1704094800,
  sunset: 1704127200,
  timestamp: 1704110400,
};

describe("CurrentWeather", () => {
  it("renders the city and country", () => {
    render(<CurrentWeather weather={weather} />);
    expect(screen.getByText("London, GB")).toBeInTheDocument();
  });

  it("renders the temperature and feels-like temperature", () => {
    const { container } = render(<CurrentWeather weather={weather} />);
    // The temperature and its °C unit are split across a text node and a
    // nested <span>, so assert on the combined text content.
    expect(container.textContent).toContain("21°C");
    expect(screen.getByText("Feels like 19°C")).toBeInTheDocument();
  });

  it("renders the weather description", () => {
    render(<CurrentWeather weather={weather} />);
    expect(screen.getByText("clear sky")).toBeInTheDocument();
  });

  it("renders humidity and wind speed", () => {
    render(<CurrentWeather weather={weather} />);
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText("3.5 m/s")).toBeInTheDocument();
  });

  it("renders a full weekday/month/day date derived from the timestamp", () => {
    render(<CurrentWeather weather={weather} />);
    // e.g. "Monday, January 1" — locale-formatted, so match the shape rather
    // than a hardcoded weekday (timezone-dependent on the test machine).
    expect(
      screen.getByText(/^[A-Za-z]+, [A-Za-z]+ \d{1,2}$/)
    ).toBeInTheDocument();
  });

  it("renders sunrise and sunset as formatted times", () => {
    render(<CurrentWeather weather={weather} />);
    const times = screen.getAllByText(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
    expect(times).toHaveLength(2);
  });
});
