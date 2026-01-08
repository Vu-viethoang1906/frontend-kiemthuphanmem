export type AppTheme = "light" | "dark" | "system";

const THEME_KEY = "app_theme";

// Get system preference
export const getSystemTheme = (): "light" | "dark" => {
  if (typeof globalThis === "undefined" || !globalThis.window) return "light";
  if (
    globalThis.window.matchMedia &&
    globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

// Get effective theme (resolves "system" to actual theme)
export const getEffectiveTheme = (): "light" | "dark" => {
  const stored = getStoredTheme();
  if (stored === "system") {
    return getSystemTheme();
  }
  return stored;
};

export const getStoredTheme = (): AppTheme => {
  if (typeof globalThis === "undefined" || !globalThis.window) return "system";
  const stored = globalThis.window.localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return "system"; // Default to system
};

export const applyTheme = (theme: AppTheme) => {
  if (typeof globalThis === "undefined" || !globalThis.document) return;
  const root = globalThis.document.documentElement;
  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
  
  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

export const setTheme = (theme: AppTheme) => {
  if (typeof globalThis !== "undefined" && globalThis.window) {
    globalThis.window.localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(theme);
};

// Listen to system theme changes
export const watchSystemTheme = (callback: (theme: "light" | "dark") => void) => {
  if (typeof globalThis === "undefined" || !globalThis.window) return () => {};
  
  const mediaQuery = globalThis.window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }
  
  // Fallback for older browsers
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
};


