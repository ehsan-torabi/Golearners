"use client";

import { cn } from "@/lib/utils";

/* Icons here are functional state glyphs, not decoration (DESIGN.md):
   sun/moon is the clearest possible label for a theme switch. */
function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("gl-theme", next);
    } catch {
      /* private mode: theme just does not persist */
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تغییر تم روشن و تاریک"
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-control border border-line bg-card text-foreground transition-colors duration-(--motion) ease-motion hover:bg-muted",
        className,
      )}
    >
      <span className="hidden dark:inline">
        <SunIcon />
      </span>
      <span className="inline dark:hidden">
        <MoonIcon />
      </span>
    </button>
  );
}
