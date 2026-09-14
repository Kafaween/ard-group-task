/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  LoadingSpinner,
  WeatherSkeleton,
  InitialState,
} from "@/components/LoadingState";

describe("LoadingSpinner", () => {
  it.each(["small", "medium", "large"] as const)(
    "renders the %s size without crashing",
    (size) => {
      const { container } = render(<LoadingSpinner size={size} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    }
  );

  it("defaults to the medium size when none is given", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector("svg")).toHaveClass("w-8", "h-8");
  });
});

describe("WeatherSkeleton", () => {
  it("renders 4 weather-detail placeholders and 4 forecast-card placeholders", () => {
    const { container } = render(<WeatherSkeleton />);
    const detailGrid = container.querySelector(".grid-cols-2");
    // Both grids share "md:grid-cols-4"; only the forecast grid also has
    // "flex" (it's a horizontal-scroll row on mobile), so combine selectors
    // to disambiguate.
    const forecastGrid = container.querySelector(".flex.md\\:grid-cols-4");

    expect(detailGrid?.children).toHaveLength(4);
    expect(forecastGrid?.children).toHaveLength(4);
  });
});

describe("InitialState", () => {
  it("renders the default heading and helper text", () => {
    render(<InitialState />);
    expect(screen.getByText("Weather Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Search for a city to see current weather conditions and a 5-day forecast"
      )
    ).toBeInTheDocument();
  });
});
