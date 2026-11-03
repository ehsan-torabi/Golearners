"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CartLink } from "@/components/site/cart-link";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string };

/* site header, «هزاران آموزش» style: brand + links on the reading start,
   a wide center search that submits to /courses without JS, session actions
   at the end. The dashboard CTA follows the session: guests get «ورود»,
   learners get «آموزش‌های من», admins land on the management console. */
export function SiteNavbar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { status, session, isAdmin } = useSession();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const linkCls = (href: string) =>
    cn(
      "rounded-control px-3 py-1.5 text-sm transition-colors duration-(--motion) ease-motion",
      isActive(href)
        ? "bg-primary-tint font-medium text-accent-strong"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 md:gap-4 md:px-6">
        <Link href="/" className="shrink-0 text-xl font-semibold tracking-tight text-foreground">
          گو<span className="text-accent-strong">Learn</span>
        </Link>
        <nav className="hidden shrink-0 items-center gap-0.5 text-sm lg:flex" aria-label="ناوبری اصلی">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <NavbarSearch />
        <div className="ms-auto flex items-center gap-1.5">
          <ThemeToggle />
          <CartLink />
          <AuthActions status={status} isAdmin={isAdmin} loggedIn={Boolean(session)} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="lg:hidden"
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
                    className={cn(linkCls(l.href), "px-3 py-2.5 font-medium")}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 flex flex-col gap-2 px-1">
                <CartLink stacked />
                <AuthActions status={status} isAdmin={isAdmin} loggedIn={Boolean(session)} stacked />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/* center search: a real GET form so it works without JS, like the listing page */
function NavbarSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  return (
    <form
      role="search"
      action="/courses"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/courses?q=${encodeURIComponent(term)}` : "/courses");
      }}
      className="hidden min-w-0 flex-1 justify-center px-2 md:flex"
    >
      <div className="relative w-full max-w-xl">
        <Input
          aria-label="جستجوی آموزش"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی آموزش ..."
          className="h-10 rounded-field border-border bg-muted pe-11 text-sm"
        />
        <button
          type="submit"
          aria-label="جستجو"
          className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-accent-strong"
        >
          <SearchIcon className="size-4.5" aria-hidden />
        </button>
      </div>
    </form>
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
            "inline-flex items-center gap-1.5 rounded-control border border-border text-sm text-muted-foreground transition-colors duration-(--motion) ease-motion hover:border-destructive/40 hover:bg-destructive-bg hover:text-destructive-text",
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
        آموزش‌های من
      </Button>
      <LogoutButton
        className={cn(
          "inline-flex items-center gap-1.5 rounded-control border border-border text-sm text-muted-foreground transition-colors duration-(--motion) ease-motion hover:border-destructive/40 hover:bg-destructive-bg hover:text-destructive-text",
          stacked ? "h-9 justify-center px-3" : "size-8 justify-center",
        )}
        iconOnly={!stacked}
      />
    </>
  );
}
