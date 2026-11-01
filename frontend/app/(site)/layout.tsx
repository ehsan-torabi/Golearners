import type { ReactNode } from "react";
import { SiteNavbar, type NavLink } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";

const nav: NavLink[] = [
  { href: "/courses", label: "دوره‌ها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/instructor", label: "درباره مدرس" },
  { href: "/contact", label: "تماس" },
];

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteNavbar links={nav} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      <SiteFooter />
    </>
  );
}
