"use client";

import { useCallback, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "timeline-theme";

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function resolveInitialTheme() {
  if (typeof window === "undefined") {
    return "light" as ThemeMode;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const frame = requestAnimationFrame(() => setIsReady(true));
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return;
      }
      const next = event.matches ? "dark" : "light";
      setTheme(next);
    };
    media.addEventListener("change", handleMediaChange);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    applyTheme(theme);
    if (isReady) {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [isReady, theme]);

  const setThemeMode = useCallback((next: ThemeMode) => {
    setTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => (previous === "dark" ? "light" : "dark"));
  }, []);

  return {
    theme,
    isReady,
    setTheme: setThemeMode,
    toggleTheme,
  };
}
