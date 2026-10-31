import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { api, LEVEL_FA } from "@/lib/api";
import { fa, formatTomanFromRial } from "@/lib/utils";

export const revalidate = 600;

interface Detail {
  course: {
    id: string; slug: string; title: string; summary: string;
    level: "beginner" | "intermediate" | "advanced";
    price_rial: number; compare_at_price_rial: number | null;
  };
  description_html: string;
  prerequisites_html: string;
  outcomes: string[];
  sections: { id: string; title: string; position: number }[];
  lessons: { id: string; section_id: string; title: string; position: number; is_preview: boolean; duration_seconds: number }[];
  rating_avg: number | null;
  rating_count: number;
  owned_by_viewer: boolean;
}

async function detail(slug: string): Promise<Detail | null> {
  try {
    return await api<Detail>(`/courses/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await detail(decodeURIComponent(slug));
  if (!d) return { title: "دوره پیدا نشد" };
  return {
    title: d.course.title,
    description: d.course.summary,
    alternates: { canonical: `/courses/${slug}` },
    openGraph: { title: d.course.title, description: d.course.summary, type: "website", locale: "fa_IR" },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await detail(decodeURIComponent(slug));
  if (!d) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: d.course.title,
    description: d.course.summary,
    inLanguage: "fa-IR",
    provider: { "@type": "Organization", name: "گوLearn", url: process.env.SITE_URL ?? "http://localhost:3000" },
    ...(d.rating_count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: d.rating_avg, ratingCount: d.rating_count } }
      : {}),
  };

  const totalMinutes = Math.round(d.lessons.reduce((s, l) => s + l.duration_seconds, 0) / 60);

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="مسیر" className="text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">دوره‌ها</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{d.course.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <header className="space-y-3">
            <Badge>{LEVEL_FA[d.course.level]}</Badge>
            <h1 className="font-display text-2xl leading-snug">{d.course.title}</h1>
            <p className="text-muted-foreground">{d.course.summary}</p>
            {totalMinutes > 0 && (
              <p className="text-sm text-muted-foreground">
                {fa(d.lessons.length)} درس • {fa(totalMinutes)} دقیقه ویدیو
              </p>
            )}
          </header>

          {d.outcomes.length > 0 && (
            <Card className="p-6">
              <h2 className="font-display text-base">در این دوره یاد می‌گیرید</h2>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-7 text-muted-foreground">
                {d.outcomes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Card>
          )}

          <section aria-labelledby="curriculum">
            <h2 id="curriculum" className="mb-3 font-display text-xl">سرفصل‌ها</h2>
            <div className="space-y-3">
              {d.sections.map((sec) => (
                <Card key={sec.id} className="overflow-hidden">
                  <details>
                    <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium">
                      {sec.position}. {sec.title}
                      <ChevronDown className="size-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    </summary>
                    <ul className="border-t border-border">
                      {d.lessons
                        .filter((l) => l.section_id === sec.id)
                        .map((l) => (
                          <li key={l.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                            <span className="text-foreground/90">{l.title}</span>
                            {l.is_preview ? (
                              <span className="text-xs text-success">پیش‌نمایش رایگان</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">قفل</span>
                            )}
                          </li>
                        ))}
                    </ul>
                  </details>
                </Card>
              ))}
            </div>
          </section>

          {d.description_html && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-3 font-display text-xl">درباره این دوره</h2>
              <Card className="prose-invert p-6 text-sm leading-8" dangerouslySetInnerHTML={{ __html: d.description_html }} />
            </section>
          )}

          {d.prerequisites_html && (
            <section aria-labelledby="prereq">
              <h2 id="prereq" className="mb-3 font-display text-xl">پیش‌نیازها</h2>
              <Card className="p-6 text-sm leading-8" dangerouslySetInnerHTML={{ __html: d.prerequisites_html }} />
            </section>
          )}
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <Card className="p-6">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-foreground">
                {d.course.price_rial === 0 ? "رایگان" : formatTomanFromRial(d.course.price_rial)}
              </span>
              {d.course.compare_at_price_rial != null && d.course.compare_at_price_rial > d.course.price_rial && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatTomanFromRial(d.course.compare_at_price_rial)}
                </span>
              )}
            </div>
            <div className="mt-5 space-y-2.5">
              {d.owned_by_viewer ? (
                <ButtonLink href={`/dashboard/courses/${encodeURIComponent(d.course.slug)}`} className="w-full" size="lg">
                  ادامه دوره
                </ButtonLink>
              ) : (
                <BuyButton slug={d.course.slug} />
              )}
              <p className="text-center text-xs text-muted-foreground">
                دسترسی مادام‌العمر • پرداخت امن • بازگشت وجه تا ۳۰ دقیقه
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function BuyButton({ slug }: { slug: string }) {
  return (
    <ButtonLink href={`/checkout?course=${encodeURIComponent(slug)}`} className="w-full" size="lg">
      خرید دوره
    </ButtonLink>
  );
}
