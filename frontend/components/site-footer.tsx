import Link from "next/link";

const links = [
  { href: "/courses", label: "دوره‌ها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/instructor", label: "درباره مدرس" },
  { href: "/contact", label: "تماس" },
];

export type FooterCategory = { id: string; slug: string; title: string; icon?: string };

/* «هزاران آموزش» footer: light band, brand note, the real link row and a
   topic directory built from the categories that actually exist. */
export function SiteFooter({ categories }: { categories: FooterCategory[] }) {
  return (
    <footer className="mt-16 border-t border-line bg-muted/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:px-6">
        <div>
          <p className="text-xl font-semibold text-foreground">
            گو<span className="text-accent-display">Learn</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
            دوره‌های ویدیویی برنامه‌نویسی به فارسی، پروژه‌محور و با دسترسی مادام‌العمر.
            ویدیوها را یک بار بخر، برای همیشه داشته باش.
          </p>
          <a
            href="mailto:support@golearn.ir"
            className="mt-4 inline-block text-sm font-medium text-accent-strong hover:underline"
          >
            support@golearn.ir
          </a>
        </div>
        <nav aria-label="ناوبری پابرگ" className="md:justify-self-end">
          <p className="text-sm font-semibold text-foreground">دسترسی سریع</p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted-foreground transition-colors hover:text-accent-strong">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {categories.length > 0 && (
        <div className="border-t border-line">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
            <p className="text-sm font-semibold text-foreground">موضوع‌های آموزشی</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/courses?category=${encodeURIComponent(c.slug)}`}
                    className="text-muted-foreground transition-colors hover:text-accent-strong"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="border-t border-line py-5 text-center text-xs text-muted-foreground">
        گوLearn ،۱۴۰۵. همه محتوا متعلق به این رسانه است.
      </div>
    </footer>
  );
}
