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
import { useSession } from "@/components/use-session";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string };

/* navbar-02 block: sticky header, desktop links, sheet menu on mobile.
   The dashboard CTA follows the session: guests get «ورود», learners get
   «داشبورد», admins land on the management console. */
export function SiteNavbar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { status, session, isAdmin } = useSession();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

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
          <AuthActions
            status={status}
            isAdmin={isAdmin}
            loggedIn={Boolean(session)}
          />
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
                <AuthActions
                  status={status}
                  isAdmin={isAdmin}
                  loggedIn={Boolean(session)}
                  stacked
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function AuthActions({
  status,
  isAdmin,
  loggedIn,
  stacked = false,
}: {
  status: "loading" | "ready";
  isAdmin: boolean;
  loggedIn: boolean;
  stacked?: boolean;
}) {
  if (status === "loading") {
    /* reserve the slot so the header does not jump when the session lands */
    return <span aria-hidden className="hidden h-8 w-24 sm:inline-block" />;
  }

  if (!loggedIn) {
    return (
      <Button size="sm" variant="ghost" className={stacked ? "w-full" : "hidden sm:inline-flex"} render={<Link href="/login" />}
        nativeButton={false}
      >
        ورود
      </Button>
    );
  }

  if (isAdmin) {
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          className={cn("hidden sm:inline-flex", stacked && "w-full")}
          render={<Link href="/dashboard" />}
          nativeButton={false}
        >
          داشبورد من
        </Button>
        <Button
          size="sm"
          className={cn("hidden sm:inline-flex", stacked && "w-full")}
          render={<Link href="/admin" />}
          nativeButton={false}
        >
          پنل مدیریت
        </Button>
        <LogoutButton
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-border text-sm text-muted-foreground transition-colors duration-150 hover:border-destructive/40 hover:bg-destructive-bg hover:text-destructive-text",
            stacked ? "h-9 justify-center px-3" : "size-8 justify-center",
          )}
          iconOnly={!stacked}
        />
      </>
    );
  }

  return (
    <>
      <Button
        size="sm"
        className={cn("hidden sm:inline-flex", stacked && "w-full")}
        render={<Link href="/dashboard" />}
        nativeButton={false}
      >
        داشبورد
      </Button>
      <LogoutButton
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border text-sm text-muted-foreground transition-colors duration-150 hover:border-destructive/40 hover:bg-destructive-bg hover:text-destructive-text",
          stacked ? "h-9 justify-center px-3" : "size-8 justify-center",
        )}
        iconOnly={!stacked}
      />
    </>
  );
}
