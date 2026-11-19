"use client";

import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({
  className = "",
}: {
  className?: string;
  compact?: boolean;
}) {
  const { resolvedTheme, setTheme, mounted } = useTheme();

  function toggleTheme() {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      aria-label={
        mounted
          ? isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Toggle theme"
      }
      title={
        mounted
          ? isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Toggle theme"
      }
      aria-pressed={isDark}
    >
      <span className="theme-toggle-icon-wrap" aria-hidden="true">
        {mounted && isDark ? (
          <Sun size={15} className="theme-icon-sun w-[15px] h-[15px] sm:w-[17px] sm:h-[17px]" />
        ) : (
          <Moon size={15} className="theme-icon-moon w-[15px] h-[15px] sm:w-[17px] sm:h-[17px]" />
        )}
      </span>
    </button>
  );
}
