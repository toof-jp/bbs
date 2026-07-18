import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { THEME_STORAGE_KEY, applyTheme, getStoredTheme } from "../theme";
import type { ThemeSetting } from "../theme";

const NAV_ITEMS = [
  { path: "/", label: "検索" },
  { path: "/viewer", label: "ビュワー" },
  { path: "/oekaki", label: "お絵かき" },
  { path: "/ranking", label: "ランキング" },
  { path: "/mcp", label: "MCP" },
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
      "pressable whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px]";
    return isActive(path)
      ? `${baseClass} bg-fill font-semibold text-label`
      : `${baseClass} font-medium text-label-secondary hover:text-label`;
  };

  const getMobileLinkClassName = (path: string) => {
    const baseClass = "pressable block rounded-xl px-3.5 py-2.5 text-[15px]";
    return isActive(path)
      ? `${baseClass} bg-fill font-semibold text-label`
      : `${baseClass} font-medium text-label-secondary hover:text-label`;
  };

  return (
    <header className="material-chrome sticky top-0 z-40 border-b border-separator">
      <nav className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[52px] items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              className="pressable -ml-2 inline-flex items-center justify-center rounded-full p-2 text-label-secondary hover:text-label lg:hidden"
            >
              <span className="sr-only">メニューを開く</span>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
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
                    d="M4 7h16M4 12h16M4 17h16"
                  />
                )}
              </svg>
            </button>
            <Link
              to="/"
              className="text-[15px] font-semibold tracking-[-0.01em] text-label"
            >
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
            <div className="relative">
              <select
                id="theme-menu"
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as ThemeSetting)
                }
                className="cursor-pointer appearance-none rounded-full border-0 bg-fill py-1.5 pl-3.5 pr-8 text-[13px] font-medium text-label focus:outline-none focus:ring-2 focus:ring-accent-ring"
              >
                <option value="light">ライト</option>
                <option value="dark">ダーク</option>
                <option value="system">自動</option>
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-label-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 9.5L12 5.5l4 4M8 14.5l4 4 4-4"
                />
              </svg>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div
            id="mobile-menu"
            className="menu-enter space-y-1 pb-4 pt-1 lg:hidden"
          >
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
