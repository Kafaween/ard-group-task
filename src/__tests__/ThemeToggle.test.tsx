/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    mockMatchMedia(false); // default: system prefers light
  });

  it("starts in light mode by default and offers to switch to dark", async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Switch to dark mode" })
      ).toBeInTheDocument();
    });
  });

  it("respects a stored dark preference on mount", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Switch to light mode" })
      ).toBeInTheDocument();
    });
  });

  it("toggles to dark mode on click: updates the <html> class, persists it, and flips the label", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", {
      name: "Switch to dark mode",
    });
    await user.click(button);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light mode" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles back to light mode on a second click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", {
      name: "Switch to dark mode",
    });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
