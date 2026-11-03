"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { followSystemTheme, toggleTheme } from "@/lib/theme";

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
  /* the mode is announced, because the icon swap alone tells a screen
     reader nothing about the state that just changed */
  const [announcement, setAnnouncement] = React.useState("");

  React.useEffect(() => followSystemTheme(), []);

  const toggle = () => {
    const next = toggleTheme();
    setAnnouncement(next === "dark" ? "تم تاریک فعال شد" : "تم روشن فعال شد");
  };

  return (
    <>
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
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
