"use client";

// Theme hook — reads/writes the data-theme attribute on <html> (set pre-hydrate
// by the no-flash boot script in layout.tsx) + persists to localStorage. All
// styling is CSS-var driven, so flipping the attribute retints instantly; React
// only needs `theme` for the toggle button's own label/icon. `mounted` guards
// against a hydration mismatch (server has no DOM theme).
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "openfly-admin-theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    // Read the live attribute (source of truth) so the toggle is robust to
    // stale closures and avoids side effects inside a state updater.
    const cur =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota/availability errors */
    }
    setTheme(next);
  }, []);

  return { theme, toggle, mounted };
}
