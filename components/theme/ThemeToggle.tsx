"use client";

import { MoonStar, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useThemePreference } from "@/hooks/useThemePreference";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme, isReady } = useThemePreference();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative h-9 w-9"
      disabled={!isReady}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all",
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
      />
      <MoonStar
        className={cn(
          "absolute h-4 w-4 transition-all",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
