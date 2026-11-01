"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

export type NavItem = { href: string; label: string };

export function SiteHeader({ nav }: { nav: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

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
      "rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-primary-tint font-medium text-accent-strong"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="text-lg font-semibold text-foreground">
          گو<span className="text-accent-strong">Learn</span>
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
          <ButtonLink href="/dashboard" size="sm" className="hidden sm:inline-flex">
            ورود / داشبورد
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-card md:hidden"
          >
            <span aria-hidden className="flex w-4 flex-col gap-1">
              <span
                className={cn(
                  "h-0.5 rounded bg-foreground transition-transform duration-150",
                  open && "translate-y-1.5 rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-0.5 rounded bg-foreground transition-opacity duration-150",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-0.5 rounded bg-foreground transition-transform duration-150",
                  open && "-translate-y-1.5 -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <div id="mobile-nav" ref={menuRef} hidden={!open} className="border-t border-border bg-card md:hidden">
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3" aria-label="ناوبری موبایل">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)}>
              {item.label}
            </Link>
          ))}
          <ButtonLink href="/dashboard" size="sm" className="mt-1 w-full">
            ورود / داشبورد
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
