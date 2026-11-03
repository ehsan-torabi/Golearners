import type { ReactNode } from "react";
import { SiteNavbar, type NavLink } from "@/components/site-navbar";
import { SiteFooter, type FooterCategory } from "@/components/site-footer";
import { CartProvider } from "@/lib/cart";
import { api } from "@/lib/api";

const nav: NavLink[] = [
  { href: "/courses", label: "دوره‌ها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/instructor", label: "درباره مدرس" },
  { href: "/contact", label: "تماس" },
];

async function categories(): Promise<FooterCategory[]> {
  try {
    const res = await api<{ data: FooterCategory[] }>("/categories");
    return res.data ?? [];
  } catch {
    return []; // footer renders without the directory; ISR retries
  }
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const cats = await categories();
  return (
    <CartProvider>
      <SiteNavbar links={nav} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">{children}</main>
      <SiteFooter categories={cats} />
    </CartProvider>
  );
}
