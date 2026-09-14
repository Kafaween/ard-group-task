/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ForecastCard, ForecastList } from "@/components/ForecastCard";
import type { DayForecast } from "@/types/weather";

const baseForecast: DayForecast = {
  date: "Jan 2",
  dayName: "Tue",
  tempHigh: 18,
  tempLow: 10,
  humidity: 70,
  windSpeed: 4.2,
  description: "light rain",
  icon: "10d",
  precipitation: 60,
};

describe("ForecastCard", () => {
  it("renders the day name, date, and description", () => {
    render(<ForecastCard forecast={baseForecast} />);
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Jan 2")).toBeInTheDocument();
    expect(screen.getByText("light rain")).toBeInTheDocument();
  });

  it("renders high and low temperatures", () => {
    const { container } = render(<ForecastCard forecast={baseForecast} />);
    expect(container.textContent).toContain("18°");
    expect(container.textContent).toContain("10°");
  });

  it("renders humidity and wind", () => {
    render(<ForecastCard forecast={baseForecast} />);
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("4.2 m/s")).toBeInTheDocument();
  });

  it("renders the precipitation row even when there is no rain, so every card has the same layout", () => {
    render(<ForecastCard forecast={{ ...baseForecast, precipitation: 0 }} />);
    expect(screen.getByText("Rain")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows the precipitation percentage when there is rain", () => {
    render(<ForecastCard forecast={baseForecast} />);
    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});

describe("ForecastList", () => {
  it("renders one card per forecast day", () => {
    const forecasts: DayForecast[] = [
      { ...baseForecast, dayName: "Tue" },
      { ...baseForecast, dayName: "Wed" },
      { ...baseForecast, dayName: "Thu" },
      { ...baseForecast, dayName: "Fri" },
    ];

    render(<ForecastList forecasts={forecasts} />);
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
  });

  it("renders nothing in the list when there are no forecasts", () => {
    const { container } = render(<ForecastList forecasts={[]} />);
    expect(container.querySelectorAll(".snap-center")).toHaveLength(0);
  });
});
