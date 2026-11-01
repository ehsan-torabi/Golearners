import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "گوLearn | آموزش برنامه‌نویسی به فارسی", template: "%s | گوLearn" },
  description: "دوره‌های ویدیویی برنامه‌نویسی به زبان فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.",
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  openGraph: { locale: "fa_IR", siteName: "گوLearn", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/* runs before first paint: stored theme wins, else system preference, else light */
const themeInit = `(function(){try{var t=localStorage.getItem("gl-theme");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
