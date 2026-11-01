import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, LEVEL_FA, LEVEL_COLORS, formatTomanFromRial } from "@/lib/api";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { fa } from "@/lib/utils";

/* per-viewer state (owned, lesson progress) needs the session cookie */
export const dynamic = "force-dynamic";

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
  owner_state?: OwnerLesson[];
  rating_avg: number | null;
  rating_count: number;
  owned_by_viewer: boolean;
}

interface OwnerLesson {
  id: string;
  title: string;
  section_id: string;
  position: number;
  duration_seconds: number;
  accessible: boolean;
  completed: boolean;
  position_seconds: number;
}

async function detail(slug: string): Promise<Detail | null> {
  try {
    return await api<Detail>(`/courses/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

/** lesson progress for a buyer: completed, accessible and the playback position */
async function ownerCurriculum(slug: string): Promise<OwnerLesson[] | null> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  if (!access) return null;
  try {
    const res = await fetch(
      `${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me/courses/${encodeURIComponent(slug)}/curriculum`,
      { headers: { Cookie: `gl_at=${access}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { lessons: OwnerLesson[] };
    return body.lessons ?? [];
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

/** seconds -> «۰۳:۲۰» */
function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${fa(String(m).padStart(2, "0"))}:${fa(String(s).padStart(2, "0"))}`;
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
  const jar = await cookies();
  const loggedIn = Boolean(jar.get("gl_at")?.value);
  const ownerLessons = d.owned_by_viewer ? await ownerCurriculum(d.course.slug) : null;
  const owned = Boolean(d.owned_by_viewer);

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteBreadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "دوره‌ها", href: "/courses" },
          { label: d.course.title },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <header className="space-y-3 border-b border-line pb-8">
            <Badge tone={LEVEL_COLORS[d.course.level]}>{LEVEL_FA[d.course.level]}</Badge>
            <h1 className="font-semibold text-4xl leading-[1.3]">{d.course.title}</h1>
            <p className="max-w-2xl leading-8 text-muted-foreground">{d.course.summary}</p>
            {totalMinutes > 0 && (
              <p className="text-sm text-muted-foreground">
                {fa(d.lessons.length)} درس، {fa(totalMinutes)} دقیقه ویدیو
              </p>
            )}
          </header>

          {(d.outcomes ?? []).length > 0 && (
            <section aria-labelledby="outcomes">
              <h2 id="outcomes" className="mb-4 font-semibold text-2xl">در این دوره یاد می‌گیری</h2>
              <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {(d.outcomes ?? []).map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-7 text-muted-foreground">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-accent-display" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="curriculum">
            <h2 id="curriculum" className="mb-4 font-semibold text-2xl">سرفصل‌ها</h2>
            <div className="space-y-3">
              {d.sections.map((sec) => (
                <Card key={sec.id} className="overflow-hidden">
                  <details className="group">
                    <summary className="flex list-none items-center justify-between gap-4 p-5 text-sm font-medium text-foreground">
                      <span>
                        <span aria-hidden className="me-2 font-semibold text-accent-display">{fa(sec.position)}</span>
                        {sec.title}
                      </span>
                      <span
                        aria-hidden
                        className="font-semibold text-xl leading-none text-muted-foreground transition-transform duration-(--motion) ease-motion group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <ul className="border-t border-line">
                      {d.lessons
                        .filter((l) => l.section_id === sec.id)
                        .map((l) => {
                          const state = ownerLessons?.find((o) => o.id === l.id);
                          const playable = Boolean(state?.accessible);
                          const title = <span className="text-foreground/90">{l.title}</span>;
                          return (
                            <li
                              key={l.id}
                              className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm"
                            >
                              {playable ? (
                                <Link
                                  href={`/dashboard/courses/${encodeURIComponent(d.course.slug)}?lesson=${l.id}`}
                                  className="truncate transition-colors duration-150 hover:text-accent-strong"
                                >
                                  {title}
                                </Link>
                              ) : (
                                title
                              )}
                              {state ? (
                                state.completed ? (
                                  <span className="shrink-0 text-xs font-medium text-success-text">
                                    تمام‌شده
                                  </span>
                                ) : playable ? (
                                  <span className="shrink-0 text-xs font-medium text-accent-strong">
                                    {state.position_seconds > 0
                                      ? `ادامه از ${formatClock(state.position_seconds)}`
                                      : "پخش"}
                                  </span>
                                ) : (
                                  <span className="shrink-0 text-xs text-muted-foreground">
                                    با درس قبلی باز می‌شود
                                  </span>
                                )
                              ) : l.is_preview ? (
                                <span className="shrink-0 text-xs font-medium text-success-text">
                                  پیش‌نمایش رایگان
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">با خرید باز می‌شود</span>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  </details>
                </Card>
              ))}
            </div>
          </section>

          {d.description_html && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-4 font-semibold text-2xl">درباره این دوره</h2>
              <Card
                className="p-6 text-sm leading-8 [&_a]:text-accent-strong [&_a]:underline [&_h2]:font-semibold [&_h3]:font-semibold [&_pre]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: d.description_html }}
              />
            </section>
          )}

          {d.prerequisites_html && (
            <section aria-labelledby="prereq">
              <h2 id="prereq" className="mb-4 font-semibold text-2xl">پیش‌نیازها</h2>
              <Card
                className="p-6 text-sm leading-8 [&_a]:text-accent-strong [&_a]:underline [&_h2]:font-semibold [&_h3]:font-semibold [&_pre]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: d.prerequisites_html }}
              />
            </section>
          )}
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <Card className="border-ink p-6 shadow-raise">
            {owned ? (
              <>
                <p className="text-sm font-medium text-success-text">این دوره را خریده‌اید</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  دسترسی شما به همه درس‌ها باز است و پیشرفت‌تان ذخیره می‌شود.
                </p>
                <div className="mt-5 space-y-3">
                  <ButtonLink
                    href={`/dashboard/courses/${encodeURIComponent(d.course.slug)}`}
                    className="w-full"
                    size="lg"
                  >
                    ادامه یادگیری
                  </ButtonLink>
                  <ButtonLink
                    href={`/dashboard/courses/${encodeURIComponent(d.course.slug)}`}
                    variant="outline"
                    className="w-full"
                  >
                    رفتن به فهرست درس‌ها
                  </ButtonLink>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-3xl text-foreground">
                    {d.course.price_rial === 0 ? "رایگان" : formatTomanFromRial(d.course.price_rial)}
                  </span>
                  {d.course.compare_at_price_rial != null &&
                    d.course.compare_at_price_rial > d.course.price_rial && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatTomanFromRial(d.course.compare_at_price_rial)}
                      </span>
                    )}
                </div>
                <div className="mt-5 space-y-3">
                  {loggedIn ? (
                    <ButtonLink
                      href={`/checkout?course=${encodeURIComponent(d.course.slug)}`}
                      className="w-full"
                      size="lg"
                    >
                      خرید دوره
                    </ButtonLink>
                  ) : (
                    <ButtonLink
                      href={`/login?next=${encodeURIComponent(`/courses/${d.course.slug}`)}`}
                      className="w-full"
                      size="lg"
                    >
                      ورود برای خرید
                    </ButtonLink>
                  )}
                  <ul className="space-y-1.5 text-xs leading-6 text-muted-foreground">
                    <li>دسترسی مادام‌العمر به همه درس‌ها</li>
                    <li>پرداخت امن با درگاه‌های بانکی ایران</li>
                    <li>بازگشت وجه تا ۳۰ دقیقه بعد از خرید</li>
                  </ul>
                </div>
              </>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
