import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { SitePagination } from "@/components/site/pagination";
import { formatJalali } from "@/lib/jalali";
import { fa, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "وبلاگ",
  description: "مقالات آموزش برنامه‌نویسی به فارسی.",
  alternates: { canonical: "/blog" },
};
export const revalidate = 600;

interface Post {
  slug: string; title: string; excerpt: string;
  cover_url?: string | null;
  category?: { slug: string; title: string } | null;
  published_at: string | null; reading_minutes: number;
}
type BlogCategory = { id: string; slug: string; title: string };

const PER_PAGE = 12;

interface Props {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
}

/* مجله layout, faradars-style: search hero, topic tiles, a featured cover
   story and the rest as cover cards. Every filter is a URL, so it works
   without JS. */
export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam, category, tag, q } = await searchParams;
  const wanted = Math.max(1, Number(pageParam) || 1);

  const params = new URLSearchParams({ per_page: String(PER_PAGE) });
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  if (q) params.set("q", q);
  params.set("page", String(wanted));

  let posts: Post[] = [];
  let categories: BlogCategory[] = [];
  let total = 0;
  try {
    const [p, c] = await Promise.all([
      api<{ data: Post[]; meta: { total: number } }>(`/blog/posts?${params}`),
      api<{ data: BlogCategory[] }>("/blog/categories"),
    ]);
    posts = p.data ?? [];
    total = p.meta?.total ?? 0;
    categories = c.data ?? [];
  } catch {
    posts = [];
  }

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(wanted, pages);
  const filtered = Boolean(category || tag || q);
  const [featured, ...rest] = posts;

  const tileHref = (slug?: string) => {
    const sp = new URLSearchParams();
    if (slug) sp.set("category", slug);
    if (tag) sp.set("tag", tag);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/blog?${qs}` : "/blog";
  };

  return (
    <div className="space-y-8">
      <SiteBreadcrumb items={[{ label: "خانه", href: "/" }, { label: "وبلاگ" }]} />

      {/* search hero: the brand band, like the مجله front page */}
      <section className="hero-band reveal rounded-surface border border-line px-6 py-10 sm:px-10" aria-labelledby="blog-title">
        <div className="mx-auto max-w-2xl text-center">
          <h1 id="blog-title" className="text-3xl font-semibold text-foreground md:text-4xl">وبلاگ</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-8 text-muted-foreground">
            یادداشت‌های آموزشی درباره برنامه‌نویسی، از مقدمات تا نکته‌های حرفه‌ای.
          </p>
          <form action="/blog" role="search" className="mx-auto mt-6 flex max-w-xl items-center">
            <div className="relative flex-1">
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                aria-label="جستجو در مقاله‌ها"
                placeholder="جستجو در مقاله‌ها ..."
                className="h-11 w-full rounded-field border border-line bg-card px-4 pe-11 text-sm shadow-raise outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/50"
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
        </div>
      </section>

      {/* topic tiles: only the categories that really exist */}
      {categories.length > 0 && (
        <nav aria-label="دسته‌های وبلاگ">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={tileHref()}
                aria-current={!category ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors duration-(--motion) ease-motion",
                  !category
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-line bg-card text-muted-foreground hover:border-primary/40 hover:text-accent-strong",
                )}
              >
                همه
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={tileHref(c.slug)}
                  aria-current={category === c.slug ? "true" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors duration-(--motion) ease-motion",
                    category === c.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-line bg-card text-muted-foreground hover:border-primary/40 hover:text-accent-strong",
                  )}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {filtered && (
        <p className="text-xs text-muted-foreground">
          {q && <>عبارت جستجو: «{q}»</>}
          {tag && <>برچسب: «{tag}»</>}
          {" · "}
          {fa(total)} مقاله
          <Link href="/blog" className="ms-2 text-accent-strong hover:underline">
            حذف فیلترها
          </Link>
        </p>
      )}

      {posts.length === 0 ? (
        <EmptyState
          title={filtered ? "مقاله‌ای با این فیلترها پیدا نشد" : "هنوز مقاله‌ای منتشر نشده است"}
          body={filtered ? "عبارت دیگری را جست‌وجو کن یا فیلترها را بردار." : "نوشته‌های تازه به‌زودی همین‌جا منتشر می‌شوند."}
          actionHref={filtered ? "/blog" : undefined}
          actionLabel={filtered ? "همه مقاله‌ها" : undefined}
        />
      ) : (
        <>
          {/* the newest post is the cover story; the rest are uniform cards */}
          <FeaturedCard post={featured} />
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
          <SitePagination
            page={page}
            totalPages={pages}
            basePath="/blog"
            params={{ category, tag, q }}
          />
        </>
      )}
    </div>
  );
}

function Cover({ post, priority = false }: { post: Post; priority?: boolean }) {
  if (post.cover_url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- media served from
         the API origin, next/image would need remotePatterns per deployment */
      <img
        src={post.cover_url}
        alt={`تصویر مقالهٔ ${post.title}`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className="media-dim aspect-video w-full object-cover transition-transform duration-(--motion-slow) ease-motion group-hover:scale-[1.02]"
      />
    );
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-primary-tint">
      <span aria-hidden className="font-display text-4xl font-semibold text-primary/40">
        {post.title.slice(0, 2)}
      </span>
    </div>
  );
}

function FeaturedCard({ post }: { post: Post }) {
  return (
    <article className="group overflow-hidden rounded-surface border border-line bg-card transition-[box-shadow,border-color] duration-(--motion) ease-motion hover:border-primary/35 hover:shadow-raise">
      <Link
        href={`/blog/${encodeURIComponent(post.slug)}`}
        className="grid items-stretch sm:grid-cols-[2fr_3fr]"
        aria-label={post.title}
      >
        <div className="overflow-hidden">
          <Cover post={post} priority />
        </div>
        <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
          {post.category && (
            <span className="w-fit rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong">
              {post.category.title}
            </span>
          )}
          <h2 className="text-xl font-semibold leading-9 text-foreground transition-colors duration-(--motion) ease-motion group-hover:text-accent-strong md:text-2xl">
            {post.title}
          </h2>
          <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {post.published_at ? formatJalali(new Date(post.published_at)) : ""}
            {post.reading_minutes > 0 && ` · ${fa(post.reading_minutes)} دقیقه مطالعه`}
          </p>
        </div>
      </Link>
    </article>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-surface border border-line bg-card transition-[box-shadow,border-color,transform] duration-(--motion) ease-motion hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-raise">
      <Link
        href={`/blog/${encodeURIComponent(post.slug)}`}
        className="flex h-full flex-col"
        aria-label={post.title}
      >
        <div className="overflow-hidden">
          <Cover post={post} />
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          {post.category && (
            <span className="w-fit rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong">
              {post.category.title}
            </span>
          )}
          <h2 className="line-clamp-2 text-[15px] font-medium leading-7 text-foreground transition-colors duration-(--motion) ease-motion group-hover:text-accent-strong">
            {post.title}
          </h2>
          <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">{post.excerpt}</p>
          <p className="mt-auto border-t border-border-variant pt-3 text-xs text-muted-foreground">
            {post.published_at ? formatJalali(new Date(post.published_at)) : ""}
            {post.reading_minutes > 0 && ` · ${fa(post.reading_minutes)} دقیقه مطالعه`}
          </p>
        </div>
      </Link>
    </article>
  );
}
