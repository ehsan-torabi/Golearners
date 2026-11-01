import type { ReactNode } from "react";
import { SiteHeader, type NavItem } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const nav: NavItem[] = [
  { href: "/courses", label: "دوره‌ها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/instructor", label: "درباره مدرس" },
  { href: "/contact", label: "تماس" },
];

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader nav={nav} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      <SiteFooter />
    </>
  );
}
