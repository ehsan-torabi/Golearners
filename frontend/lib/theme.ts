/**
 * Theme engine. The active theme lives on <html data-theme>; the choice is
 * kept in localStorage so it survives reloads. Two rules:
 *
 * - an explicit choice wins over the OS preference, always;
 * - with no explicit choice, the OS preference is followed live, so a page
 *   left open across sunset flips with the system.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "gl-theme";

/** Browser chrome colour per theme. Mirrors --background in globals.css. */
export const THEME_COLOR: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#0b0d1c",
};

/** How long the swap transition runs, in ms. Kept in sync with --motion. */
const SWAP_MS = 240;

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** The theme the visitor picked, or null when they have not picked one. */
export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    /* private mode: the theme just does not persist */
    return null;
  }
}

/**
 * Paint the theme. The swap attribute is what lets the tokens animate once
 * on change; it is removed right after so component hover transitions are
 * not held back by it.
 */
export function applyTheme(theme: Theme, persist = true) {
  const root = document.documentElement;
  root.dataset.theme = theme;

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* private mode: the theme just does not persist */
    }
  }

  root.dataset.themeSwap = "1";
  window.setTimeout(() => {
    delete root.dataset.themeSwap;
  }, SWAP_MS);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

/** Follow the OS preference for as long as the visitor has not chosen. */
export function followSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return;
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = (event: MediaQueryListEvent) => {
    if (storedTheme()) return;
    applyTheme(event.matches ? "dark" : "light", false);
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Runs before the first paint so the page never flashes the wrong theme.
 * It ships inline in <head>, so it stays a string rather than a function.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)},c=${JSON.stringify(
  THEME_COLOR,
)},r=document.documentElement,t=localStorage.getItem(k);if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}r.dataset.theme=t;var m=document.createElement("meta");m.setAttribute("name","theme-color");m.setAttribute("content",c[t]);document.head.appendChild(m);}catch(e){document.documentElement.dataset.theme="light";}})();`;

