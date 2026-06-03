export type ThemeSetting = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "bbs-search-theme";

export function getStoredTheme(): ThemeSetting {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  return "system";
}

export function applyTheme(theme: ThemeSetting) {
  if (typeof window === "undefined") {
    return;
  }

  const shouldUseDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", shouldUseDark);
  document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";
}
