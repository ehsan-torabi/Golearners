import type { Metadata, Viewport } from "next";
import { SiteHeader, type NavItem } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "گوLearn | آموزش برنامه‌نویسی به فارسی", template: "%s | گوLearn" },
  description: "دوره‌های ویدیویی برنامه‌نویسی به زبان فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.",
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  openGraph: { locale: "fa_IR", siteName: "گوLearn", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f5ec" },
    { media: "(prefers-color-scheme: dark)", color: "#151b24" },
  ],
};

const nav: NavItem[] = [
  { href: "/courses", label: "دوره‌ها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/instructor", label: "درباره مدرس" },
  { href: "/contact", label: "تماس" },
];

/* runs before first paint: stored theme wins, else system preference, else light */
const themeInit = `(function(){try{var t=localStorage.getItem("gl-theme");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-dvh antialiased">
        <SiteHeader nav={nav} />
        <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
