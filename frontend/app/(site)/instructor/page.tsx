import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import type { Metadata } from "next";
import Link from "next/link";
import { GithubIcon, GlobeIcon, LinkedinIcon, MailIcon, TwitterIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { api, type CourseSummary } from "@/lib/api";
import { fa, jsonLdScript } from "@/lib/utils";
import { CourseCard } from "@/components/course-card";

export const metadata: Metadata = {
  title: "درباره مدرس",
  description: "معرفی مدرس دوره‌های برنامه‌نویسی گوLearn.",
  alternates: { canonical: "/instructor" },
};

export const revalidate = 600;

type Instructor = {
  /** empty when the profile's anchor user has no name on file */
  full_name?: string | null;
  headline: string;
  bio_html: string;
  avatar_url?: string | null;
  socials: Record<string, string>;
};
type Testimonial = { id: string; author_name: string; author_role: string; body: string; rating: number | null };

/** the socials the console manages; anything else the API returns still renders
    as a plain link so a stored website entry is never silently dropped */
const SOCIAL_META: Record<string, { label: string; Icon: typeof GlobeIcon }> = {
  github: { label: "گیت‌هاب", Icon: GithubIcon },
  linkedin: { label: "لینکدین", Icon: LinkedinIcon },
  website: { label: "وب‌سایت", Icon: GlobeIcon },
  twitter: { label: "توییتر", Icon: TwitterIcon },
};

function initial(name?: string | null): string {
  return name?.trim().charAt(0) || "م";
}

export default async function InstructorPage() {
  const [instructor, testimonials, courses] = await Promise.all([
    api<Instructor>("/instructor").catch(() => null),
    api<{ data: Testimonial[] }>("/testimonials").catch(() => ({ data: [] as Testimonial[] })),
    api<{ data: CourseSummary[] }>("/courses?per_page=100").catch(() => ({ data: [] as CourseSummary[] })),
  ]);
  const quotes = testimonials.data ?? [];
  const socialEntries = Object.entries(instructor?.socials ?? {}).filter(
    ([, url]) => typeof url === "string" && url.trim() !== "",
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: instructor?.full_name?.trim() || "مدرس گوLearn",
    jobTitle: instructor?.headline?.trim() || "مهندس نرم‌افزار و مدرس",
    worksFor: { "@type": "Organization", name: "گوLearn" },
    ...(instructor?.avatar_url ? { image: instructor.avatar_url } : {}),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <SiteBreadcrumb items={[{ label: "خانه", href: "/" }, { label: "درباره مدرس" }]} />

      <h1 className="reveal font-semibold text-3xl">درباره مدرس</h1>

      {!instructor ? (
        <EmptyState
          className="mt-8"
          title="اطلاعات مدرس هنوز تکمیل نشده است"
          body="معرفی مدرس به‌زودی همین‌جا منتشر می‌شود. تا آن زمان می‌توانی سرفصل دوره‌ها را ببینی."
          actionHref="/courses"
          actionLabel="دیدن دوره‌ها"
        />
      ) : (
        <>
          {/* profile header: the photo is the first thing a reader looks for —
              the uploaded media when the console set one, otherwise a designed
              initial so the slot never collapses into a blank box */}
          <section className="reveal-2 mt-8 flex flex-col items-center gap-6 rounded-surface border border-line bg-card p-8 text-center sm:flex-row sm:items-center sm:text-start">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-card bg-primary-tint shadow-raise sm:size-28">
              {instructor.avatar_url ? (
                <img
                  src={instructor.avatar_url}
                  alt={`تصویر ${instructor.full_name?.trim() || "مدرس"}`}
                  className="size-full object-cover"
                  width={112}
                  height={112}
                />
              ) : (
                <span
                  aria-hidden
                  className="flex size-full items-center justify-center font-display text-4xl font-semibold text-primary/45"
                >
                  {initial(instructor.full_name)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {instructor.full_name?.trim() && (
                <p className="font-semibold text-2xl text-foreground">{instructor.full_name}</p>
              )}
              {instructor.headline && (
                <p className="mt-2 border-s-4 border-accent-display ps-4 text-lg leading-8 text-foreground sm:border-s-0 sm:ps-0">
                  {instructor.headline}
                </p>
              )}
              {socialEntries.length > 0 && (
                <ul className="mt-5 flex flex-wrap justify-center gap-2.5 sm:justify-start">
                  {socialEntries.map(([name, url]) => {
                    // an email entry is an address, everything else a URL; both
                    // must be absolute or the link does nothing when clicked
                    const href = name === "email" ? `mailto:${url.trim()}` : url.trim();
                    const absolute = /^(https?:\/\/|mailto:)/i.test(href);
                    const meta = SOCIAL_META[name];
                    const Icon = meta?.Icon;
                    return (
                      <li key={name}>
                        <a
                          href={absolute ? href : undefined}
                          rel="noopener noreferrer nofollow"
                          target={absolute && !href.startsWith("mailto:") ? "_blank" : undefined}
                          className="inline-flex h-10 items-center gap-2 rounded-control border border-line bg-card px-3.5 text-sm text-foreground transition-colors duration-(--motion) ease-motion hover:bg-muted"
                        >
                          {Icon ? <Icon className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden /> : null}
                          {meta?.label ?? name}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {instructor.bio_html && (
            <div
              className="mt-8 text-[0.95rem] leading-9 [&_a]:text-accent-strong [&_a]:underline [&_h2]:mt-8 [&_h2]:font-semibold [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-xl [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6"
              dangerouslySetInnerHTML={{ __html: instructor.bio_html }}
            />
          )}
        </>
      )}

      {courses.data.length > 0 && (
        <section aria-labelledby="courses" className="mt-14">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="courses" className="font-semibold text-2xl">
              دوره‌های مدرس
            </h2>
            <Link
              href="/courses"
              className="text-sm text-accent-strong transition-opacity duration-(--motion) hover:opacity-80"
            >
              همهٔ دوره‌ها
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.data.slice(0, 6).map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">{fa(courses.data.length)} دورهٔ منتشرشده</p>
        </section>
      )}

      {quotes.length > 0 && (
        <section aria-labelledby="voices" className="mt-14">
          <h2 id="voices" className="mb-6 font-semibold text-2xl">
            نظر دانشجوها
          </h2>
          <ul className="space-y-4">
            {quotes.map((t) => (
              <li key={t.id} className="rounded-surface border border-line bg-card p-6">
                <blockquote className="text-sm leading-8 text-foreground">{t.body}</blockquote>
                <footer className="mt-3 text-xs text-muted-foreground">
                  {t.author_name}
                  {t.author_role ? `، ${t.author_role}` : ""}
                </footer>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
