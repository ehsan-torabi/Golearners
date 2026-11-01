"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string };

/* navbar-02 block: sticky header, desktop links, sheet menu on mobile.
   Links come from the caller, so every entry points at a real route. */
export function SiteNavbar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const linkCls = (href: string) =>
    cn(
      "rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
      isActive(href)
        ? "bg-primary-tint font-medium text-accent-strong"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link href="/" className="shrink-0 text-lg font-semibold text-foreground">
          گو<span className="text-accent-strong">Learn</span>
        </Link>
        <nav className="ms-6 hidden items-center gap-1 text-sm md:flex" aria-label="ناوبری اصلی">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" variant="ghost" className="hidden sm:inline-flex" render={<Link href="/login" />}>
            ورود
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" render={<Link href="/dashboard" />}>
            داشبورد
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="md:hidden"
                  aria-label="باز کردن منو"
                />
              }
            >
              <MenuIcon className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]" dir="rtl" lang="fa">
              <SheetHeader>
                <SheetTitle>منو</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 px-1" aria-label="ناوبری موبایل">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(linkCls(l.href), "px-3 py-2 font-medium")}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 flex flex-col gap-2 px-1">
                <Button variant="outline" className="w-full" render={<Link href="/login" />}>
                  ورود
                </Button>
                <Button className="w-full" render={<Link href="/dashboard" />}>
                  داشبورد
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
