import Link from "next/link";
import { SearchIcon, ChevronLeftIcon, StarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHead } from "@/components/ui/section-head";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCard } from "@/components/course-card";
import { CategoryMark } from "@/components/site/category-icon";
import { api, LEVEL_FA, formatTomanFromRial, type CourseSummary } from "@/lib/api";
import { fa } from "@/lib/utils";

export const revalidate = 300;

type Faq = { id: string; question: string; answer: string };
type Category = { id: string; slug: string; title: string; icon?: string; icon_url?: string | null };

async function featured(): Promise<CourseSummary[]> {
  try {
    const res = await api<{ data: CourseSummary[] }>("/courses?sort=popular&per_page=6");
    return res.data ?? [];
  } catch {
    return []; // backend down: render the shell, ISR retries on next request
  }
}

async function siteMeta(): Promise<{ faqs: Faq[]; categories: Category[] }> {
  const [q, c] = await Promise.all([
    api<{ data: Faq[] }>("/faqs").catch(() => ({ data: [] as Faq[] })),
    api<{ data: Category[] }>("/categories").catch(() => ({ data: [] as Category[] })),
  ]);
  return { faqs: q.data ?? [], categories: c.data ?? [] };
}

export default async function HomePage() {
  const [courses, { faqs: questions, categories }] = await Promise.all([featured(), siteMeta()]);
  const [flagship, ...rest] = courses;

  return (
    <div className="space-y-14">
      {/* hero: the one brand gradient band; search submits to /courses like the navbar */}
      <section className="hero-band reveal rounded-surface border border-line px-6 py-12 sm:px-10 sm:py-16" aria-labelledby="hero-title">
        <div className="mx-auto max-w-2xl text-center">
          <h1 id="hero-title" className="text-[34px] leading-[1.25] font-semibold text-foreground md:text-[44px] md:leading-[1.2]">
            برنامه‌نویسی را <span className="text-accent-strong">درست</span> یاد بگیر
          </h1>
          <p className="reveal-2 mx-auto mt-4 max-w-xl text-[15px] leading-8 text-muted-foreground">
            دوره‌های ویدیویی فارسی، پروژه‌محور و با دسترسی مادام‌العمر. ویدیوها را یک بار بخر،
            برای همیشه داشته باش.
          </p>
          <form action="/courses" role="search" className="reveal-3 mx-auto mt-8 flex max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <input
                type="search"
                name="q"
                aria-label="جستجوی آموزش"
                placeholder="به دنبال یادگیری کدوم آموزش هستی؟"
                className="h-12 w-full rounded-field border border-line bg-card px-4 pe-11 text-sm shadow-raise outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/50"
              />
              <button
                type="submit"
                aria-label="جستجو"
                className="absolute inset-y-0 end-0 my-auto flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-accent-strong"
              >
                <SearchIcon className="size-5" aria-hidden />
              </button>
            </div>
          </form>
          <div className="reveal-3 mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/courses"
              className="inline-flex h-11 items-center rounded-control bg-primary px-6 text-sm font-medium text-primary-foreground transition-[background-color,transform] duration-(--motion) ease-motion hover:bg-primary-hover active:translate-y-px"
            >
              دیدن دوره‌ها
            </Link>
            <Link
              href="/instructor"
              className="inline-flex h-11 items-center rounded-control border border-ink/15 bg-card px-6 text-sm font-medium text-foreground transition-colors duration-(--motion) ease-motion hover:border-primary/40 hover:text-accent-strong"
            >
              آشنایی با مدرس
            </Link>
          </div>
        </div>
      </section>

      {/* topic circles: only the categories that really exist */}
      {categories.length > 0 && (
        <section aria-labelledby="topics-title">
          <SectionHead id="topics-title" title="موضوع‌های آموزشی" href="/courses" />
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/courses?category=${encodeURIComponent(c.slug)}`}
                  className="group flex flex-col items-center gap-2.5 rounded-surface p-3 text-center transition-colors duration-(--motion) ease-motion hover:bg-muted"
                >
                  <span
                    aria-hidden
                    className="flex size-16 items-center justify-center rounded-full border border-line bg-card text-accent-strong transition-[border-color,box-shadow] duration-(--motion) ease-motion group-hover:border-primary/40 group-hover:shadow-raise"
                  >
                    <CategoryMark icon={c.icon} title={c.title} iconUrl={c.icon_url} />
                  </span>
                  <span className="text-xs leading-5 text-muted-foreground transition-colors group-hover:text-foreground">
                    {c.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="featured-title">
        <SectionHead id="featured-title" title="دوره‌های پربازدید" href="/courses" />
        {courses.length === 0 ? (
          <EmptyState
            title="هنوز دوره‌ای منتشر نشده است"
            body="اولین دوره‌ها به‌زودی اینجا دیده می‌شوند؛ این صفحه را دوباره بررسی کن."
          />
        ) : (
          <div className="space-y-5">
            {flagship && <FlagshipCard course={flagship} />}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="process-title">
        <SectionHead id="process-title" title="مسیر یادگیری" />
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ["۱", "انتخاب دوره", "بر اساس سطح و موضوع، دورهٔ مناسب خودت را پیدا کن."],
            ["۲", "خرید و دسترسی همیشگی", "پرداخت با درگاه‌های بانکی ایران؛ ویدیوها بعد از خرید همیشه در دسترس‌اند."],
            ["۳", "یادگیری با پشتیبانی", "اگر جایی گیر کردی، از صفحهٔ تماس برای مدرس پیام بگذار."],
          ].map(([n, title, body]) => (
            <li key={n} className="rounded-surface border border-line bg-card p-6">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-full bg-primary-tint font-display text-lg font-semibold text-accent-strong"
              >
                {n}
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {questions.length > 0 && (
        <section aria-labelledby="faq-title">
          <SectionHead id="faq-title" title="سوال‌های پرتکرار" />
          <div className="mx-auto max-w-3xl space-y-3">
            {questions.map((q) => (
              <details key={q.id} className="group rounded-surface border border-line bg-card">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground">
                  {q.question}
                  <ChevronLeftIcon
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--motion) ease-motion group-open:-rotate-90"
                  />
                </summary>
                <p className="border-t border-line px-5 py-4 text-sm leading-8 text-muted-foreground">
                  {q.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="hero-band rounded-surface border border-line px-6 py-12 text-center" aria-label="شروع یادگیری">
        <h2 className="text-2xl font-semibold text-foreground">دوره‌ات را انتخاب کن</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          از اولین درس تا آخرین پروژه، همه چیز فارسی و قدم‌به‌قدم.
        </p>
        <Link
          href="/courses"
          className="mt-6 inline-flex h-11 items-center rounded-control bg-primary px-6 text-sm font-medium text-primary-foreground transition-[background-color,transform] duration-(--motion) ease-motion hover:bg-primary-hover active:translate-y-px"
        >
          انتخاب دوره
        </Link>
      </section>
    </div>
  );
}

/* the most-viewed course gets a wide horizontal treatment (content hierarchy, R-14) */
function FlagshipCard({ course }: { course: CourseSummary }) {
  const hasDiscount = course.compare_at_price_rial != null && course.compare_at_price_rial > course.price_rial;
  return (
    <Card className="group overflow-hidden transition-[box-shadow,border-color] duration-(--motion) ease-motion hover:border-primary/35 hover:shadow-raise">
      <Link
        href={`/courses/${encodeURIComponent(course.slug)}`}
        className="grid items-stretch sm:grid-cols-[280px_1fr]"
      >
        <div className="relative flex aspect-video items-center justify-center bg-primary-tint sm:aspect-auto">
          <span aria-hidden className="font-display text-6xl font-semibold text-primary/40">
            {course.title.slice(0, 2)}
          </span>
        </div>
        <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong">
              {LEVEL_FA[course.level]}
            </span>
            {course.rating_count > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <StarIcon className="size-3.5 fill-warning text-warning" aria-hidden />
                {fa((course.rating_avg ?? 0).toFixed(1))} از {fa(course.rating_count)} نظر
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold leading-8 text-foreground transition-colors duration-(--motion) ease-motion group-hover:text-accent-strong md:text-2xl">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{course.summary}</p>
          <div className="flex items-baseline gap-3 pt-1">
            <span className="text-lg font-semibold text-foreground">
              {course.price_rial === 0 ? "رایگان" : formatTomanFromRial(course.price_rial)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatTomanFromRial(course.compare_at_price_rial as number)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
