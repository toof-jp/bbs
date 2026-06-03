import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { THEME_STORAGE_KEY, applyTheme, getStoredTheme } from "../theme";
import type { ThemeSetting } from "../theme";

export function Header() {
  const location = useLocation();
  const [theme, setTheme] = useState<ThemeSetting>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => applyTheme("system");
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getLinkClassName = (path: string) => {
    const baseClass =
      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
    return isActive(path)
      ? `${baseClass} border-blue-500 text-gray-900 dark:text-gray-100`
      : `${baseClass} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white dark:hover:border-gray-600`;
  };

  return (
    <header className="bg-white shadow-md dark:bg-gray-900 dark:shadow-gray-950/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              <Link to="/" className={getLinkClassName("/")}>
                掲示板検索
              </Link>
              <Link to="/oekaki" className={getLinkClassName("/oekaki")}>
                お絵かきをまとめる機械
              </Link>
              <Link to="/ranking" className={getLinkClassName("/ranking")}>
                IDランキング
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <label className="sr-only" htmlFor="theme-menu">
              テーマ
            </label>
            <select
              id="theme-menu"
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeSetting)}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">OSに合わせる</option>
            </select>
          </div>
        </div>
      </nav>
    </header>
  );
}
