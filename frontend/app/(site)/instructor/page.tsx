import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { jsonLdScript } from "@/lib/utils";

export const metadata: Metadata = {
  title: "درباره مدرس",
  description: "معرفی مدرس دوره‌های برنامه‌نویسی گوLearn.",
  alternates: { canonical: "/instructor" },
};

export const revalidate = 600;

type Instructor = { headline: string; bio_html: string; socials: Record<string, string> };
type Testimonial = { id: string; author_name: string; author_role: string; body: string; rating: number | null };

export default async function InstructorPage() {
  const [instructor, testimonials] = await Promise.all([
    api<Instructor>("/instructor").catch(() => null),
    api<{ data: Testimonial[] }>("/testimonials").catch(() => ({ data: [] as Testimonial[] })),
  ]);
  const quotes = testimonials.data ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "مدرس گوLearn",
    jobTitle: "مهندس نرم‌افزار و مدرس",
    worksFor: { "@type": "Organization", name: "گوLearn" },
  };

  return (
    <div className="mx-auto max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
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
        <div className="mt-8 space-y-10">
          {instructor.headline && (
            <p className="border-s-4 border-accent-display ps-4 text-lg leading-8 text-foreground">
              {instructor.headline}
            </p>
          )}
          {instructor.bio_html && (
            <div
              className="text-[0.95rem] leading-9 [&_a]:text-accent-strong [&_a]:underline [&_h2]:mt-8 [&_h2]:font-semibold [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-xl [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6"
              dangerouslySetInnerHTML={{ __html: instructor.bio_html }}
            />
          )}
          {Object.keys(instructor.socials ?? {}).length > 0 && (
            <ul className="flex flex-wrap gap-3 text-sm">
              {Object.entries(instructor.socials).map(([name, url]) =>
                // a social entry is a website address, never a scheme handler
                typeof url === "string" && /^https?:\/\//i.test(url) ? (
                  <li key={name}>
                    <a
                      href={url}
                      rel="noopener noreferrer nofollow"
                      target="_blank"
                      className="inline-flex h-10 items-center rounded-control border border-line bg-card px-4 text-foreground transition-colors duration-(--motion) ease-motion hover:bg-muted"
                    >
                      {name}
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </div>
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
