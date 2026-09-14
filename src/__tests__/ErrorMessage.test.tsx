/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { WeatherErrorCode } from "@/types/weather";

const titlesByCode: Record<WeatherErrorCode, string> = {
  INVALID_CITY: "City Not Found",
  RATE_LIMIT: "Too Many Requests",
  NETWORK_ERROR: "Connection Error",
  API_ERROR: "Service Error",
  MISSING_API_KEY: "Configuration Error",
  UNKNOWN_ERROR: "Something Went Wrong",
};

describe("ErrorMessage", () => {
  it.each(Object.entries(titlesByCode) as [WeatherErrorCode, string][])(
    "renders the correct title for %s",
    (code, title) => {
      render(<ErrorMessage message="details" code={code} />);
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  );

  it("renders the provided message", () => {
    render(<ErrorMessage message="City not found" code="INVALID_CITY" />);
    expect(screen.getByText("City not found")).toBeInTheDocument();
  });

  it("does not render a retry button when onRetry is not provided", () => {
    render(<ErrorMessage message="details" code="NETWORK_ERROR" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a retry button and calls onRetry when clicked", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <ErrorMessage message="details" code="NETWORK_ERROR" onRetry={onRetry} />
    );

    await user.click(screen.getByRole("button", { name: "Try Again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(["INVALID_CITY", "RATE_LIMIT", "MISSING_API_KEY"] as const)(
    "shows extra help text for %s",
    (code) => {
      render(<ErrorMessage message="details" code={code} />);
      const helpTexts = [
        "Try searching for a different city or check the spelling",
        "Please wait a moment before trying again",
        "The weather service is not properly configured. Please contact support.",
      ];
      const found = helpTexts.some((text) => screen.queryByText(text));
      expect(found).toBe(true);
    }
  );

  it.each(["NETWORK_ERROR", "API_ERROR", "UNKNOWN_ERROR"] as const)(
    "shows no extra help text for %s",
    (code) => {
      render(<ErrorMessage message="details" code={code} />);
      expect(
        screen.queryByText(
          /Try searching|Please wait a moment|not properly configured/
        )
      ).not.toBeInTheDocument();
    }
  );
});
