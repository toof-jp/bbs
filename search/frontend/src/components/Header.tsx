import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { THEME_STORAGE_KEY, applyTheme, getStoredTheme } from "../theme";
import type { ThemeSetting } from "../theme";

const NAV_ITEMS = [
  { path: "/", label: "掲示板検索" },
  { path: "/viewer", label: "ビュワー" },
  { path: "/oekaki", label: "お絵かきをまとめる機械" },
  { path: "/ranking", label: "IDランキング" },
  { path: "/mcp", label: "MCPサーバー" },
];

export function Header() {
  const location = useLocation();
  const [theme, setTheme] = useState<ThemeSetting>(() => getStoredTheme());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the mobile menu on navigation.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

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
      "whitespace-nowrap rounded-lg px-3 py-2 text-sm transition";
    return isActive(path)
      ? `${baseClass} bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300`
      : `${baseClass} font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white`;
  };

  const getMobileLinkClassName = (path: string) => {
    const baseClass = "block rounded-lg px-3 py-2 text-base transition";
    return isActive(path)
      ? `${baseClass} bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300`
      : `${baseClass} font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <span className="sr-only">メニューを開く</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-50"
            >
              <svg
                className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              掲示板検索
            </Link>
          </div>
          <div className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={getLinkClassName(item.path)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center">
            <label className="sr-only" htmlFor="theme-menu">
              テーマ
            </label>
            <select
              id="theme-menu"
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeSetting)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="light">☀️ ライト</option>
              <option value="dark">🌙 ダーク</option>
              <option value="system">💻 OSに合わせる</option>
            </select>
          </div>
        </div>
        {isMenuOpen && (
          <div id="mobile-menu" className="space-y-1 pb-4 pt-1 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={getMobileLinkClassName(item.path)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
