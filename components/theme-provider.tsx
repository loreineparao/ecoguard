"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  mounted: false,
});

const THEME_STORAGE_KEY = "ecoguard_theme";

const emptySubscribe = () => () => {};

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("ecoguard:theme-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ecoguard:theme-changed", callback);
  };
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Ignore localStorage access errors
  }
  return "system";
}

function getServerTheme(): Theme {
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, getServerTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Update DOM data-theme attribute and listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    function applyTheme() {
      const isSystemDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const active =
        theme === "dark" || (theme === "system" && isSystemDark)
          ? "dark"
          : "light";

      setResolvedTheme(active);
      document.documentElement.setAttribute("data-theme", active);
      document.documentElement.classList.toggle("dark", active === "dark");
    }

    applyTheme();

    if (theme === "system" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, mounted]);

  function setTheme(newTheme: Theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      window.dispatchEvent(new Event("ecoguard:theme-changed"));
    } catch {
      // Ignore localStorage access errors
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
