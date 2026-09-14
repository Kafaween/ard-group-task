"use client";

import { useEffect, useState } from "react";
import { applyTheme, resolveInitialTheme, setStoredTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  // The inline script in layout.tsx already applied the right theme to
  // <html> before hydration; this just syncs the button's own state so its
  // icon/label match once mounted (server-rendered markup can't know the
  // client's stored preference or OS setting).
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Reading the client's real theme (localStorage/matchMedia) is only
    // possible after mount, since the server can't know it — this Effect
    // exists purely to sync that one-time read into state, which is exactly
    // the sanctioned "synchronize with an external system" use case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolveInitialTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    setStoredTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
      aria-pressed={theme === "dark"}
      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
    >
      {theme === "dark" ? (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
