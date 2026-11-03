import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Check, ChevronDown, Lock, Play, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, LEVEL_FA, formatTomanFromRial } from "@/lib/api";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { ReviewForm } from "@/components/site/review-form";
import { PromoPlayer } from "@/components/site/promo-player";
import { PreviewLessonItem } from "@/components/site/preview-lesson";
import { cn, fa, faPercent } from "@/lib/utils";

/* per-viewer state (owned, lesson progress) needs the session cookie */
export const dynamic = "force-dynamic";

interface Detail {
  course: {
    id: string; slug: string; title: string; summary: string;
    level: "beginner" | "intermediate" | "advanced";
    price_rial: number; compare_at_price_rial: number | null;
    cover_url?: string;
    has_promo?: boolean;
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

/** the same detail, but with the viewer's cookie so owned_by_viewer is real */
async function detailForViewer(slug: string): Promise<Detail | null> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  if (!access) return detail(slug);
  try {
    const res = await fetch(
      `${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/courses/${encodeURIComponent(slug)}`,
      { headers: { Cookie: `gl_at=${access}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as Detail;
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

export interface CourseReview {
  id: string;
  rating: number;
  body: string;
  author_name: string;
  approved_at: string | null;
}

interface ReviewsPayload {
  data: CourseReview[];
  meta: { total: number };
  rating_avg: number | null;
  rating_count: number;
}

/** approved reviews only; a failing call renders the section without them */
async function approvedReviews(slug: string): Promise<ReviewsPayload | null> {
  try {
    return await api<ReviewsPayload>(`/courses/${encodeURIComponent(slug)}/reviews?per_page=20`);
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
  const d = await detailForViewer(decodeURIComponent(slug));
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
  const reviews = await approvedReviews(d.course.slug);
  const hasDiscount =
    d.course.compare_at_price_rial != null && d.course.compare_at_price_rial > d.course.price_rial;
  const offPct = hasDiscount
    ? Math.round((1 - d.course.price_rial / (d.course.compare_at_price_rial as number)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* course hero: the brand band carries title, rating and facts */}
      <section className="hero-band reveal rounded-surface border border-line px-6 py-8 md:px-10 md:py-10">
        <SiteBreadcrumb
          className="mb-5 text-muted-foreground"
          items={[
            { label: "خانه", href: "/" },
            { label: "دوره‌ها", href: "/courses" },
            { label: d.course.title },
          ]}
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong">
                {LEVEL_FA[d.course.level]}
              </span>
              {d.rating_count > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="size-4 fill-warning text-warning" strokeWidth={2} aria-hidden />
                  <span className="font-medium text-foreground">{fa((d.rating_avg ?? 0).toFixed(1))}</span>
                  ({fa(d.rating_count)} نظر)
                </span>
              )}
            </div>
            <h1 className="font-semibold text-3xl leading-[1.35] md:text-4xl">{d.course.title}</h1>
            <p className="max-w-2xl leading-8 text-muted-foreground">{d.course.summary}</p>
            {totalMinutes > 0 && (
              <p className="text-sm text-muted-foreground">
                {fa(d.lessons.length)} درس، {fa(totalMinutes)} دقیقه ویدیو
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          {(d.outcomes ?? []).length > 0 && (
            <section aria-labelledby="outcomes">
              <h2 id="outcomes" className="mb-4 font-semibold text-2xl">در این دوره یاد می‌گیری</h2>
              <ul className="grid gap-x-8 gap-y-3 rounded-surface border border-line bg-card p-6 sm:grid-cols-2">
                {(d.outcomes ?? []).map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground">
                    <span
                      aria-hidden
                      className="mt-1.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success-bg"
                    >
                      <Check className="size-3 text-success-text" strokeWidth={3} />
                    </span>
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
                <details key={sec.id} className="group overflow-hidden rounded-surface border border-line bg-card">
                  <summary className="flex list-none items-center justify-between gap-4 bg-muted/60 p-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <span>
                      <span aria-hidden className="me-2 font-semibold text-accent-display">{fa(sec.position)}</span>
                      {sec.title}
                    </span>
                    <ChevronDown
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--motion) ease-motion group-open:rotate-180"
                    />
                  </summary>
                  <ul className="divide-y divide-border-variant border-t border-line">
                    {d.lessons
                      .filter((l) => l.section_id === sec.id)
                      .map((l) => {
                        const state = ownerLessons?.find((o) => o.id === l.id);
                        const playable = Boolean(state?.accessible);
                        // anonymous / not-owned visitors: preview lessons play
                        // inline, the rest stay honest locked teasers
                        if (!state && l.is_preview) {
                          return <PreviewLessonItem key={l.id} lesson={l} />;
                        }
                        const title = <span className="text-foreground/90">{l.title}</span>;
                        return (
                          <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-sm md:px-5">
                            <LessonMark state={state ? (state.completed ? "done" : playable ? "play" : "locked") : "locked"} />
                            {playable ? (
                              <Link
                                href={`/dashboard/courses/${encodeURIComponent(d.course.slug)}?lesson=${l.id}`}
                                className="min-w-0 flex-1 truncate transition-colors duration-150 hover:text-accent-strong"
                              >
                                {title}
                              </Link>
                            ) : (
                              <span className="min-w-0 flex-1 truncate">{title}</span>
                            )}
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatClock(l.duration_seconds)}
                            </span>
                            <span className="hidden w-28 shrink-0 text-end text-xs sm:block">
                              {state ? (
                                state.completed ? (
                                  <span className="font-medium text-success-text">تمام‌شده</span>
                                ) : playable ? (
                                  <span className="font-medium text-accent-strong">
                                    {state.position_seconds > 0
                                      ? `ادامه از ${formatClock(state.position_seconds)}`
                                      : "پخش"}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">با درس قبلی باز می‌شود</span>
                                )
                              ) : (
                                <span className="text-muted-foreground">با خرید باز می‌شود</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </details>
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

          <ReviewsSection
            reviews={reviews}
            owned={owned}
            loggedIn={loggedIn}
            slug={d.course.slug}
          />
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <Card className="overflow-hidden border-line p-0 shadow-raise">
            {/* promo video with the cover as poster when present; otherwise
                the uploaded cover; otherwise the honest tinted placeholder */}
            {d.course.has_promo ? (
              <PromoPlayer slug={d.course.slug} poster={d.course.cover_url} title={d.course.title} />
            ) : (
              <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-primary-tint">
                {d.course.cover_url ? (
                  <img
                    src={d.course.cover_url}
                    alt={`کاور دورهٔ ${d.course.title}`}
                    className="media-dim absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <span aria-hidden className="font-display text-6xl font-semibold text-primary/40">
                    {d.course.title.slice(0, 2)}
                  </span>
                )}
              </div>
            )}
            <div className="p-6">
              {owned ? (
                <>
                  <h2 className="text-base font-semibold text-success-text">این دوره را خریده‌اید</h2>
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-foreground">
                        {d.course.price_rial === 0 ? "رایگان" : formatTomanFromRial(d.course.price_rial)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatTomanFromRial(d.course.compare_at_price_rial as number)}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <span className="rounded-tag bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground">
                        {faPercent(offPct)} تخفیف
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
                    <ul className="space-y-1.5 border-t border-border-variant pt-3.5 text-xs leading-6 text-muted-foreground">
                      <li>دسترسی مادام‌العمر به همه درس‌ها</li>
                      <li>پرداخت امن با درگاه‌های بانکی ایران</li>
                      <li>بازگشت وجه تا ۳۰ دقیقه بعد از خرید</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* small state mark at the reading start of each lesson row */
function LessonMark({ state }: { state: "done" | "play" | "preview" | "locked" }) {
  if (state === "done") {
    return (
      <span aria-label="تمام‌شده" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-bg">
        <Check className="size-3 text-success-text" strokeWidth={3} />
      </span>
    );
  }
  if (state === "play" || state === "preview") {
    return (
      <span
        aria-label={state === "preview" ? "پیش‌نمایش رایگان" : "قابل پخش"}
        className="flex size-5 shrink-0 items-center justify-center"
      >
        <Play className={cn("size-3.5 fill-primary text-primary", state === "preview" && "fill-success-text text-success-text")} />
      </span>
    );
  }
  return <Lock aria-label="قفل" className="size-3.5 shrink-0 text-muted-foreground/70" />;
}

/** rating summary + approved reviews, with the submit form for buyers */
function ReviewsSection({
  reviews,
  owned,
  loggedIn,
  slug,
}: {
  reviews: ReviewsPayload | null;
  owned: boolean;
  loggedIn: boolean;
  slug: string;
}) {
  const list = reviews?.data ?? [];
  const count = reviews?.rating_count ?? 0;
  const avg = reviews?.rating_avg ?? 0;

  return (
    <section aria-labelledby="reviews" className="scroll-mt-24" id="reviews-section">
      <h2 id="reviews" className="mb-4 font-semibold text-2xl">
        نظرات دانشجوها
      </h2>

      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-surface border border-line bg-card p-5">
        <span className="text-4xl font-semibold text-foreground">
          {count > 0 ? fa(avg.toFixed(1)) : "—"}
        </span>
        <div>
          <p className="flex items-center gap-0.5 text-lg leading-none text-warning" aria-label={`امتیاز ${count > 0 ? fa(avg.toFixed(1)) : "۰"} از ۵`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                aria-hidden
                className={cn("size-4", count > 0 && avg >= i - 0.5 ? "fill-warning text-warning" : "fill-accent text-accent")}
              />
            ))}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            از {fa(count)} نظر ثبت‌شده
          </p>
        </div>
      </div>

      {list.length > 0 ? (
        <ul className="space-y-3">
          {list.map((rv) => (
            <li key={rv.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-8 items-center justify-center rounded-full bg-primary-tint text-xs font-semibold text-accent-strong"
                  >
                    {(rv.author_name || "دانشجو").slice(0, 1)}
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {rv.author_name || "دانشجو"}
                  </p>
                  <span className="flex items-center gap-0.5 text-warning" aria-label={`امتیاز ${fa(rv.rating)} از ۵`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        aria-hidden
                        className={cn("size-3.5", rv.rating >= i ? "fill-warning text-warning" : "fill-accent text-accent")}
                      />
                    ))}
                  </span>
                </div>
                {rv.body && (
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{rv.body}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-7 text-muted-foreground">
          هنوز نظری تأیید نشده است؛ اولین نفری باش که تجربه‌ات را می‌نویسی.
        </p>
      )}

      <div className="mt-6">
        {owned ? (
          <ReviewForm slug={slug} />
        ) : loggedIn ? (
          <p className="text-xs leading-6 text-muted-foreground">
            برای ثبت نظر، اول دوره را بخر؛ نظرها فقط از خریداران دوره پذیرفته می‌شود.
          </p>
        ) : (
          <p className="text-xs leading-6 text-muted-foreground">
            برای ثبت نظر وارد حساب خود شو و دوره را بخر.
          </p>
        )}
      </div>
    </section>
  );
}
