import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { api, type CourseSummary } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export const revalidate = 300;

async function featured(): Promise<CourseSummary[]> {
  try {
    const res = await api<{ data: CourseSummary[] }>("/courses?sort=popular&per_page=6");
    return res.data ?? [];
  } catch {
    return []; // backend down: render the shell (ISR retries next request)
  }
}

export default async function HomePage() {
  const courses = await featured();
  return (
    <div className="space-y-14">
      <section className="glass rounded-surface p-10 text-center">
        <h1 className="mx-auto max-w-2xl text-3xl leading-snug">
          برنامه‌نویسی را <span className="text-primary">درست</span> یاد بگیر،
          <br />
          با دوره‌های ویدیویی فارسی
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          دوره‌های پروژه‌محور با دسترسی مادام‌العمر، پشتیبانی سوال‌وجواب و به‌روزرسانی رایگان —
          پرداخت با درگاه‌های ایرانی.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <ButtonLink href="/courses" size="lg">
            مشاهده دوره‌ها
            <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
          </ButtonLink>
          <ButtonLink href="/instructor" variant="secondary" size="lg">
            آشنایی با مدرس
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="featured">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="featured" className="font-display text-xl">
            پربازدیدترین دوره‌ها
          </h2>
          <ButtonLink href="/courses" variant="ghost" size="sm">
            همه دوره‌ها
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
          </ButtonLink>
        </div>
        {courses.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            هنوز دوره‌ای منتشر نشده است — به‌زودی اولین دوره‌ها اینجا دیده می‌شوند.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3" aria-label="مزیت‌ها">
        {[
          ["دسترسی مادام‌العمر", "یک بار خرید، همیشه دسترسی؛ آپدیت‌های دوره رایگان."],
          ["پخش امن", "ویدیوها فقط برای خریدار پخش می‌شوند؛ قابل دانلود نیستند."],
          ["پشتیبانی فارسی", "سوال‌هایتان را مستقیم زیر درس‌ها بپرسید."],
        ].map(([title, body]) => (
          <Card key={title} className="p-6">
            <h3 className="font-display text-base text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
