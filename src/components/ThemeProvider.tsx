"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

/** First-time visitors always get light. After that the choice is theirs and is remembered. */
export type ThemePreference = "light" | "dark";

const STORAGE_KEY = "seduta-theme";

/** Browser bar colours, matching --bg in each theme. */
const BAR_COLOR: Record<ThemePreference, string> = {
  light: "#F4F1EA",
  dark: "#14161B",
};

interface ThemeContextValue {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStored(): ThemePreference {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "dark") return "dark";
  } catch {
    // storage unavailable: stay on light
  }
  return "light";
}

function applyTheme(theme: ThemePreference) {
  document.documentElement.setAttribute("data-theme", theme);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", BAR_COLOR[theme]));
}

/** Inline script run before paint so a saved dark choice never flashes light first. */
export const themeInitScript = `try{if(localStorage.getItem("${STORAGE_KEY}")==="dark"){document.documentElement.setAttribute("data-theme","dark");document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content","${BAR_COLOR.dark}")})}}catch(e){}`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    readStored,
    () => "light" as ThemePreference,
  );

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors: the choice still applies until the page closes
    }
    applyTheme(next);
    listeners.forEach((l) => l());
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
