// OpenFly — theme state (light / dark / system) backed by Zustand.
// Mode is persisted in localStorage under "openfly-theme"; the same key is read
// by the no-flash boot script in index.html so the first paint already matches.

import { useEffect } from "react";
import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "openfly-theme";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "dark" || (mode === "system" && systemPrefersDark()) ? "dark" : "light";
}

function readStoredMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  return "system";
}

function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", resolved);
}

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** Flip explicitly between light and dark (leaves "system" mode). */
  toggle: () => void;
  /** Re-evaluate after a system preference change (only acts in "system" mode). */
  syncSystem: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const mode = readStoredMode();
  return {
    mode,
    resolved: resolveTheme(mode),
    setMode: (next) => {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore persistence failure */
      }
      const resolved = resolveTheme(next);
      applyTheme(resolved);
      set({ mode: next, resolved });
    },
    toggle: () => {
      get().setMode(get().resolved === "dark" ? "light" : "dark");
    },
    syncSystem: () => {
      if (get().mode !== "system") return;
      const resolved = resolveTheme("system");
      applyTheme(resolved);
      set({ resolved });
    },
  };
});

/** Mount once near the app root: keeps <html data-theme> in sync with the store
 *  and follows OS preference changes while in "system" mode. */
export function useThemeSync(): void {
  const syncSystem = useThemeStore((s) => s.syncSystem);
  useEffect(() => {
    // Ensure the DOM matches the store (covers the case where the boot script failed).
    applyTheme(useThemeStore.getState().resolved);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => syncSystem();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [syncSystem]);
}
