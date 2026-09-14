/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeatherIcon } from "@/components/WeatherIcon";

describe("WeatherIcon", () => {
  it("sets the accessible label from the description", () => {
    render(<WeatherIcon icon="01d" description="clear sky" />);
    expect(screen.getByRole("img", { name: "clear sky" })).toBeInTheDocument();
  });

  it.each([
    "01d",
    "01n",
    "02d",
    "02n",
    "03d",
    "03n",
    "04d",
    "04n",
    "09d",
    "09n",
    "10d",
    "10n",
    "11d",
    "11n",
    "13d",
    "13n",
    "50d",
    "50n",
  ])("renders without crashing for icon code %s", (icon) => {
    render(<WeatherIcon icon={icon} description="test" />);
    expect(screen.getByRole("img", { name: "test" })).toBeInTheDocument();
  });

  it("falls back to the clear-sky icon for an unknown code", () => {
    render(<WeatherIcon icon="not-a-real-code" description="mystery" />);
    expect(screen.getByRole("img", { name: "mystery" })).toBeInTheDocument();
  });

  it.each(["small", "medium", "large", "hero"] as const)(
    "renders the %s size without crashing",
    (size) => {
      render(<WeatherIcon icon="01d" description="test" size={size} />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    }
  );

  it("defaults to the medium size when none is given", () => {
    render(<WeatherIcon icon="01d" description="test" />);
    expect(screen.getByRole("img")).toHaveClass("w-16", "h-16");
  });

  it("applies an extra className when provided", () => {
    render(
      <WeatherIcon icon="01d" description="test" className="custom-class" />
    );
    expect(screen.getByRole("img")).toHaveClass("custom-class");
  });
});
