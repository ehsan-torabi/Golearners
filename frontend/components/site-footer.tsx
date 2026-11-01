import Link from "next/link";

const links = [
  { href: "/courses", label: "دوره‌ها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/instructor", label: "درباره مدرس" },
  { href: "/contact", label: "تماس" },
];

/** Ink inversion band: the one full-width dark block per page (DESIGN.md rhythm break). */
export function SiteFooter() {
  return (
    <footer className="mt-16 bg-invert text-invert-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl leading-none">
            گو<span className="text-accent-display">Learn</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-invert-muted">
            دوره‌های ویدیویی برنامه‌نویسی به فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.
          </p>
        </div>
        <nav aria-label="ناوبری پابرگ" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-invert-foreground/90 hover:text-invert-foreground">
              {l.label}
            </Link>
          ))}
          <a href="mailto:support@golearn.ir" className="text-accent-display hover:underline">
            support@golearn.ir
          </a>
        </nav>
      </div>
      <div className="border-t border-invert-foreground/15 py-4 text-center text-xs text-invert-muted">
        گوLearn ،۱۴۰۵. همه محتوا متعلق به این رسانه است.
      </div>
    </footer>
  );
}
