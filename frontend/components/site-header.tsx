"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export type NavItem = { href: string; label: string };

export function SiteHeader({ nav }: { nav: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  /* route change closes the mobile menu */
  useEffect(() => setOpen(false), [pathname]);

  /* Escape closes; focus stays on the button */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const linkCls = (href: string) =>
    cn(
      "rounded-control px-3 py-2 text-sm transition-colors duration-(--motion) ease-motion",
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card shadow-raise">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="font-display text-2xl leading-none text-foreground">
          گو<span className="text-accent-display">Learn</span>
        </Link>

        <nav className="ms-4 hidden flex-1 items-center gap-1 md:flex" aria-label="ناوبری اصلی">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="hidden h-10 items-center rounded-control border border-ink bg-primary px-4 text-sm font-medium text-primary-foreground transition-[transform] duration-(--motion) ease-motion active:[transform:var(--press)] sm:inline-flex"
          >
            ورود / داشبورد
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            className="inline-flex size-10 items-center justify-center rounded-control border border-line bg-card md:hidden"
          >
            <span aria-hidden className="relative block h-3.5 w-5">
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-0.5 rounded bg-foreground transition-transform duration-(--motion) ease-motion",
                  open && "top-1/2 -translate-y-1/2 rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded bg-foreground transition-opacity duration-(--motion) ease-motion",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-0.5 rounded bg-foreground transition-transform duration-(--motion) ease-motion",
                  open && "bottom-auto top-1/2 -translate-y-1/2 -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        ref={menuRef}
        hidden={!open}
        className="border-t border-line bg-card md:hidden"
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3" aria-label="ناوبری موبایل">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)}>
              {item.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="mt-1 inline-flex h-11 items-center justify-center rounded-control border border-ink bg-primary text-sm font-medium text-primary-foreground"
          >
            ورود / داشبورد
          </Link>
        </nav>
      </div>
    </header>
  );
}
