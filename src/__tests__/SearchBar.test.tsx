/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/SearchBar";

function mockSearchesResponse(cities: string[]) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        data: cities.map((city, i) => ({
          id: i + 1,
          city,
          searchedAt: "2026-01-01",
        })),
      }),
  };
}

describe("SearchBar", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue(mockSearchesResponse([]));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("disables the search button until there is a non-empty query", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();

    await user.type(screen.getByLabelText("Search for a city"), "London");
    expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
  });

  it("calls onSearch with the trimmed query on submit", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    await user.type(screen.getByLabelText("Search for a city"), "  Paris  ");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledWith("Paris");
  });

  it("does not call onSearch for a blank query", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    await user.type(screen.getByLabelText("Search for a city"), "   ");
    await user.keyboard("{Enter}");

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("disables the input while isLoading is true", () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={true} />);
    expect(screen.getByLabelText("Search for a city")).toBeDisabled();
  });

  it("fetches and shows recent-search suggestions on focus", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockSearchesResponse(["London"]));
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

    await user.click(screen.getByLabelText("Search for a city"));

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
    expect(screen.getByRole("option", { name: /London/ })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/searches")
    );
  });

  it("selects a suggestion on click and calls onSearch", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockSearchesResponse(["Tokyo"]));
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    await user.click(screen.getByLabelText("Search for a city"));
    await waitFor(() => screen.getByRole("option", { name: /Tokyo/ }));
    await user.click(screen.getByRole("option", { name: /Tokyo/ }));

    expect(onSearch).toHaveBeenCalledWith("Tokyo");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("navigates suggestions with the keyboard and selects with Enter", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockSearchesResponse(["London", "Los Angeles"]));
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    const input = screen.getByLabelText("Search for a city");
    await user.click(input);
    await waitFor(() => screen.getByRole("listbox"));

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onSearch).toHaveBeenCalledWith("Los Angeles");
  });

  it("does not advance ArrowDown past the last suggestion", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockSearchesResponse(["London", "Los Angeles"]));
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    const input = screen.getByLabelText("Search for a city");
    await user.click(input);
    await waitFor(() => screen.getByRole("listbox"));

    // Three ArrowDowns on a 2-item list: index should stop at 1, not go to 2.
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");

    expect(onSearch).toHaveBeenCalledWith("Los Angeles");
  });

  it("does not submit while a search is already loading, even if the form submit fires", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockSearchesResponse([]));
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { container, rerender } = render(
      <SearchBar onSearch={onSearch} isLoading={false} />
    );

    // Type while still enabled so React's `query` state becomes non-empty.
    await user.type(screen.getByLabelText("Search for a city"), "London");

    // Now a search starts loading (e.g. the parent set isLoading after a
    // near-simultaneous submit) — the input/button become disabled, but
    // dispatch a raw submit event directly to exercise the isLoading guard.
    rerender(<SearchBar onSearch={onSearch} isLoading={true} />);

    const form = container.querySelector("form");
    form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("navigates back up with ArrowUp, wrapping to 'no selection' at the top", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockSearchesResponse(["London", "Los Angeles"]));
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    const input = screen.getByLabelText("Search for a city");
    await user.click(input);
    await waitFor(() => screen.getByRole("listbox"));

    // Move to index 1, back to index 0, then back up past the top (-1).
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{ArrowUp}{Enter}");

    // With selectedIndex back at -1, Enter should not select anything.
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("re-fetches suggestions after the user stops typing (debounced)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockSearchesResponse(["London"]));
    global.fetch = fetchMock;
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

    const input = screen.getByLabelText("Search for a city");
    await user.click(input); // triggers the immediate focus fetch (q="")
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await user.type(input, "a");

    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("q=a")
        );
      },
      { timeout: 1000 }
    );
  });

  it("closes the suggestions dropdown on Escape", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockSearchesResponse(["London"]));
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

    const input = screen.getByLabelText("Search for a city");
    await user.click(input);
    await waitFor(() => screen.getByRole("listbox"));

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes the suggestions dropdown when clicking outside", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockSearchesResponse(["London"]));
    const user = userEvent.setup();
    render(
      <div>
        <SearchBar onSearch={vi.fn()} isLoading={false} />
        <div data-testid="outside">outside</div>
      </div>
    );

    await user.click(screen.getByLabelText("Search for a city"));
    await waitFor(() => screen.getByRole("listbox"));

    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clears suggestions instead of crashing when the fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

    await user.click(screen.getByLabelText("Search for a city"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not show suggestions when the API returns success: false", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    });
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

    await user.click(screen.getByLabelText("Search for a city"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
