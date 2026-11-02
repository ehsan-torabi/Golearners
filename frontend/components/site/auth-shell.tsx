import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon } from "lucide-react";

/* split-screen auth, «ورود» style: the form panel at the reading start and a
   quiet brand panel beside it. The brand panel states only real product facts
   (lifetime access, Persian project-based videos, instructor support) and
   folds away on narrow screens. */
const FACTS = [
  "دسترسی مادام‌العمر به ویدیوهای هر دوره",
  "ویدیوهای فارسی و پروژه‌محور",
  "پشتیبانی مستقیم از مدرس",
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <aside className="hero-band hidden items-center justify-center border-s border-line px-10 lg:flex">
        <div className="max-w-sm space-y-8">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            گو<span className="text-accent-strong">Learn</span>
          </p>
          <p className="text-[15px] leading-8 text-muted-foreground">
            دوره‌های ویدیویی برنامه‌نویسی به فارسی، با دسترسی مادام‌العمر و پشتیبانی مستقیم مدرس.
          </p>
          <ul className="space-y-3 text-sm text-foreground">
            {FACTS.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-primary-tint">
                  <CheckIcon className="size-3 text-accent-strong" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/courses" className="inline-block text-sm font-medium text-accent-strong hover:underline">
            دیدن دوره‌ها
          </Link>
        </div>
      </aside>
    </div>
  );
}
