import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "گوLearn | آموزش برنامه‌نویسی به فارسی", template: "%s | گوLearn" },
  description: "دوره‌های ویدیویی برنامه‌نویسی به زبان فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.",
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  openGraph: { locale: "fa_IR", siteName: "گوLearn", type: "website" },
};

const nav = [
  { href: "/courses", label: "دوره‌ها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/instructor", label: "درباره مدرس" },
  { href: "/contact", label: "تماس" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* display font (Noto Kufi Arabic) — weights only used for headings */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href="/" className="font-display text-lg text-foreground">
              گو<span className="text-primary">Learn</span>
            </Link>
            <nav className="ms-4 flex flex-1 items-center gap-1 text-sm" aria-label="ناوبری اصلی">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-control px-3 py-2 text-muted-foreground transition-colors duration-(--motion) ease-motion hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/dashboard"
              className="rounded-control border-line bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-control transition-transform duration-(--motion) ease-motion active:[transform:var(--press)]"
            >
              ورود / داشبورد
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          <div className="glass rounded-surface p-6">
            <p className="font-medium text-foreground">گوLearn — آموزش برنامه‌نویسی به فارسی</p>
            <p className="mt-2">تمام حقوق محفوظ است. پشتیبانی: {""}
              <span dir="ltr">support@golearn.ir</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
