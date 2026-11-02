import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListTreeIcon } from "lucide-react";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";

export const revalidate = 600;

interface Tag {
  slug: string;
  title: string;
}
interface RelatedPost {
  slug: string;
  title: string;
  cover_url?: string | null;
  reading_minutes: number;
}
interface Post {
  slug: string; title: string; excerpt: string; body_html: string;
  cover_url?: string | null;
  category?: { slug: string; title: string } | null;
  tags?: Tag[];
  related?: RelatedPost[];
  published_at: string | null; reading_minutes: number;
  meta_description?: string | null;
}

type TocEntry = { id: string; text: string; level: 2 | 3 };

/** gives every h2/h3 a stable id and returns the TOC list; the writer's HTML
    keeps working when nothing matches (no headings → no TOC block). */
function withHeadingIds(html: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  let i = 0;
  const out = html.replace(
    /<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g,
    (_m, lvl: string, attrs: string, inner: string) => {
      i += 1;
      const id = `sec-${i}`;
      toc.push({ id, text: inner.replace(/<[^>]+>/g, "").trim(), level: Number(lvl) as 2 | 3 });
      return `<h${lvl} id="${id}"${attrs}>${inner}</h${lvl}>`;
    },
  );
  return { html: out, toc };
}

async function post(slug: string): Promise<Post | null> {
  try {
    return await api<Post>(`/blog/posts/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await post(decodeURIComponent(slug));
  if (!p) return { title: "مقاله پیدا نشد" };
  return {
    title: p.title,
    description: p.meta_description || p.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: p.title,
      description: p.meta_description || p.excerpt,
      type: "article",
      locale: "fa_IR",
      ...(p.published_at ? { publishedTime: p.published_at } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await post(decodeURIComponent(slug));
  if (!p) notFound();

  const { html: body, toc } = withHeadingIds(p.body_html);
  const tags = p.tags ?? [];
  const related = p.related ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.meta_description || p.excerpt,
    inLanguage: "fa-IR",
    ...(p.published_at ? { datePublished: p.published_at } : {}),
    ...(p.cover_url ? { image: p.cover_url } : {}),
    ...(tags.length > 0 ? { keywords: tags.map((t) => t.title).join(", ") } : {}),
  };

  return (
    <article className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteBreadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "وبلاگ", href: "/blog" },
          { label: p.title },
        ]}
      />

      <header className="space-y-4 border-b border-line pb-6">
        {p.category && (
          <Link
            href={`/blog?category=${encodeURIComponent(p.category.slug)}`}
            className="inline-block rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {p.category.title}
          </Link>
        )}
        <h1 className="font-semibold text-3xl leading-[1.4] md:text-4xl">{p.title}</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          {p.published_at ? formatJalali(new Date(p.published_at)) : ""}
          {p.reading_minutes > 0 && ` · ${fa(p.reading_minutes)} دقیقه مطالعه`}
        </p>
      </header>

      {p.cover_url && (
        <img
          src={p.cover_url}
          alt={`تصویر مقالهٔ ${p.title}`}
          fetchPriority="high"
          className="mt-8 aspect-video w-full rounded-surface border border-line object-cover"
        />
      )}

      {tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="برچسب‌ها">
          {tags.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/blog?tag=${encodeURIComponent(t.slug)}`}
                className="inline-flex h-7 items-center rounded-full border border-line px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-accent-strong"
              >
                {t.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_220px]">
        <div
          className="prose-fa min-w-0 text-[0.95rem] leading-9 [&_a]:text-accent-strong [&_a]:underline [&_blockquote]:border-e-2 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/60 [&_blockquote]:ps-4 [&_blockquote]:pe-4 [&_blockquote]:py-1 [&_blockquote]:rounded-field [&_blockquote]:text-muted-foreground [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:font-semibold [&_h2]:text-2xl [&_h3]:mt-8 [&_h3]:scroll-mt-24 [&_h3]:font-semibold [&_h3]:text-xl [&_hr]:my-8 [&_img]:rounded-field [&_li]:my-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-4 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-field [&_pre]:bg-invert [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:leading-7 [&_pre]:text-invert-foreground [&_code]:font-semibold [&_h2_code]:text-2xl [&_h3_code]:text-xl [&_p_code]:rounded-sm [&_p_code]:bg-muted [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:text-[0.85em] [&_p_code]:text-accent-strong [&_li_code]:bg-muted [&_li_code]:rounded-sm [&_li_code]:px-1 [&_li_code]:text-[0.9em] [&_table]:my-4 [&_table]:w-full [&_table]:text-sm [&_th]:border [&_th]:border-line [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6"
          dangerouslySetInnerHTML={{ __html: body }}
        />

        {toc.length > 1 && (
          <nav aria-label="فهرست مطالب" className="h-fit lg:sticky lg:top-24">
            <div className="rounded-surface border border-line bg-muted/50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ListTreeIcon className="size-3.5" aria-hidden />
                فهرست مطالب
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-6">
                {toc.map((t) => (
                  <li key={t.id} className={t.level === 3 ? "ps-3" : ""}>
                    <a href={`#${t.id}`} className="text-muted-foreground transition-colors hover:text-accent-strong">
                      {t.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-14 border-t border-line pt-8">
          <h2 id="related-title" className="mb-5 font-semibold text-xl">
            مقاله‌های مرتبط
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${encodeURIComponent(r.slug)}`}
                className="group rounded-surface border border-line bg-card p-3 transition-[box-shadow,border-color] duration-(--motion) ease-motion hover:border-primary/35 hover:shadow-raise"
              >
                {r.cover_url ? (
                  <img
                    src={r.cover_url}
                    alt={`تصویر مقالهٔ ${r.title}`}
                    loading="lazy"
                    className="aspect-video w-full rounded-field object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-field bg-primary-tint">
                    <span aria-hidden className="font-display text-2xl font-semibold text-primary/40">
                      {r.title.slice(0, 2)}
                    </span>
                  </div>
                )}
                <p className="mt-2.5 line-clamp-2 text-sm font-medium leading-6 text-foreground transition-colors group-hover:text-accent-strong">
                  {r.title}
                </p>
                {r.reading_minutes > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">{fa(r.reading_minutes)} دقیقه مطالعه</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
