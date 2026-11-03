import type { Metadata, Viewport } from "next";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: { default: "گوLearn | آموزش برنامه‌نویسی به فارسی", template: "%s | گوLearn" },
  description: "دوره‌های ویدیویی برنامه‌نویسی به زبان فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.",
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  openGraph: { locale: "fa_IR", siteName: "گوLearn", type: "website" },
};

export const viewport: Viewport = {
  // themeColor is deliberately left unset here: the browser chrome has to
  // follow the theme the visitor actually picked, not the OS preference.
  // The inline script below writes the meta tag from the resolved theme.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
