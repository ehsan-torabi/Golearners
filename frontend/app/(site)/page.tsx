import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHead } from "@/components/ui/section-head";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCard } from "@/components/course-card";
import { Badge } from "@/components/ui/badge";
import { api, LEVEL_FA, LEVEL_COLORS, formatTomanFromRial, type CourseSummary } from "@/lib/api";
import { fa } from "@/lib/utils";

export const revalidate = 300;

type Faq = { id: string; question: string; answer: string };

async function featured(): Promise<CourseSummary[]> {
  try {
    const res = await api<{ data: CourseSummary[] }>("/courses?sort=popular&per_page=6");
    return res.data ?? [];
  } catch {
    return []; // backend down: render the shell, ISR retries on next request
  }
}

async function faqs(): Promise<Faq[]> {
  try {
    const res = await api<{ data: Faq[] }>("/faqs");
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [courses, questions] = await Promise.all([featured(), faqs()]);
  const [flagship, ...rest] = courses;

  return (
    <div className="space-y-16">
      <section
        className="reveal rounded-lg border border-border bg-card px-6 py-12 shadow-raise sm:px-10 sm:py-14"
        aria-labelledby="hero-title"
      >
        <h1
          id="hero-title"
          className="max-w-3xl text-[38px] leading-[46px] font-semibold text-foreground"
        >
          برنامه‌نویسی را <span className="text-accent-strong">درست</span> یاد بگیر
        </h1>
        <p className="reveal-2 mt-5 max-w-xl text-base leading-8 text-muted-foreground">
          دوره‌های ویدیویی فارسی، پروژه‌محور و با دسترسی مادام‌العمر. ویدیوها را یک بار بخر،
          برای همیشه داشته باش.
        </p>
        <div className="reveal-3 mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/courses" size="lg">
            دیدن دوره‌ها
          </ButtonLink>
          <ButtonLink href="/instructor" variant="outline" size="lg">
            آشنایی با مدرس
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="featured-title">
        <SectionHead
          numeral="۱"
          id="featured-title"
          title="دوره‌های پربازدید"
          action={
            <ButtonLink href="/courses" variant="ghost" size="sm">
              همه دوره‌ها
            </ButtonLink>
          }
        />
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
        <SectionHead numeral="۲" id="process-title" title="مسیر یادگیری" />
        <ol className="max-w-3xl space-y-6">
          {[
            ["۱", "انتخاب دوره", "بر اساس سطح و موضوع، دورهٔ مناسب خودت را پیدا کن."],
            ["۲", "خرید و دسترسی همیشگی", "پرداخت با درگاه‌های بانکی ایران؛ ویدیوها بعد از خرید همیشه در دسترس‌اند."],
            ["۳", "یادگیری با پشتیبانی", "اگر جایی گیر کردی، از صفحهٔ تماس برای مدرس پیام بگذار."],
          ].map(([n, title, body]) => (
            <li key={n} className="flex items-start gap-5">
              <span aria-hidden className="text-3xl font-semibold leading-none text-accent-strong">
                {n}
              </span>
              <div className="border-b border-line pb-6">
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {questions.length > 0 && (
        <section aria-labelledby="faq-title">
          <SectionHead numeral="۳" id="faq-title" title="سوال‌های پرتکرار" />
          <div className="max-w-3xl space-y-3">
            {questions.map((q) => (
              <details key={q.id} className="group rounded-field border border-line bg-card">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground">
                  {q.question}
                  <span
                    aria-hidden
                    className="text-lg font-semibold leading-none text-accent-strong transition-transform duration-150 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="border-t border-line px-5 py-4 text-sm leading-8 text-muted-foreground">
                  {q.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card px-6 py-10 text-center" aria-label="شروع یادگیری">
        <h2 className="text-2xl font-semibold text-foreground">دوره‌ات را انتخاب کن</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          از اولین درس تا آخرین پروژه، همه چیز فارسی و قدم‌به‌قدم.
        </p>
        <ButtonLink href="/courses" size="lg" className="mt-6">
          انتخاب دوره
        </ButtonLink>
      </section>
    </div>
  );
}

/* the most-viewed course gets a wide horizontal treatment (content hierarchy, R-14) */
function FlagshipCard({ course }: { course: CourseSummary }) {
  const hasDiscount = course.compare_at_price_rial != null && course.compare_at_price_rial > course.price_rial;
  return (
    <Card className="group overflow-hidden transition-[transform,box-shadow] duration-(--motion) ease-motion hover:shadow-raise">
      <Link
        href={`/courses/${encodeURIComponent(course.slug)}`}
        className="grid items-stretch sm:grid-cols-[240px_1fr]"
      >
        <div className="flex aspect-video items-center justify-center bg-primary-tint sm:aspect-auto">
          <span aria-hidden className="text-5xl font-semibold text-accent-strong">
            {course.title.slice(0, 2)}
          </span>
        </div>
        <div className="flex flex-col justify-center gap-3 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={LEVEL_COLORS[course.level]}>{LEVEL_FA[course.level]}</Badge>
            {course.rating_count > 0 && (
              <span className="text-xs text-muted-foreground">
                امتیاز {fa((course.rating_avg ?? 0).toFixed(1))} از {fa(course.rating_count)} نظر
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold leading-8 text-foreground transition-colors duration-(--motion) ease-motion group-hover:text-accent-strong">
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
