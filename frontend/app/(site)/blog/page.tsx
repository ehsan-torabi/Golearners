import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { SitePagination } from "@/components/site/pagination";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "وبلاگ",
  description: "مقالات آموزش برنامه‌نویسی به فارسی.",
  alternates: { canonical: "/blog" },
};
export const revalidate = 600;

interface Post {
  slug: string; title: string; excerpt: string;
  published_at: string | null; reading_minutes: number;
  cover_url?: string;
}

const PER_PAGE = 20;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const wanted = Math.max(1, Number(pageParam) || 1);

  let posts: Post[] = [];
  let total = 0;
  try {
    const res = await api<{ data: Post[]; meta: { total: number } }>(
      `/blog/posts?per_page=${PER_PAGE}&page=${wanted}`,
    );
    posts = res.data ?? [];
    total = res.meta?.total ?? 0;
  } catch {
    posts = [];
  }

  // an out-of-range page renders empty; fall back to the last real one
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(wanted, pages);
  if (page !== wanted && posts.length === 0 && total > 0) {
    try {
      const res = await api<{ data: Post[] }>(`/blog/posts?per_page=${PER_PAGE}&page=${page}`);
      posts = res.data ?? [];
    } catch {
      posts = [];
    }
  }

  return (
    <div className="space-y-8">
      <SiteBreadcrumb items={[{ label: "خانه", href: "/" }, { label: "وبلاگ" }]} />
      <header className="reveal border-b border-line pb-8">
        <h1 className="font-semibold text-3xl">وبلاگ</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
          یادداشت‌های آموزشی درباره برنامه‌نویسی، از مقدمات تا نکته‌های حرفه‌ای.
        </p>
      </header>

      {posts.length === 0 ? (
        <EmptyState
          title="هنوز مقاله‌ای منتشر نشده است"
          body="نوشته‌های تازه به‌زودی همین‌جا منتشر می‌شوند."
        />
      ) : (
        <>
          {pages > 1 && (
            <p className="text-xs text-muted-foreground">
              {fa(total)} مقاله · صفحهٔ {fa(page)} از {fa(pages)}
            </p>
          )}
          {/* editorial dated list, deliberately not a card grid (RHYTHM 3) */}
          <ul className="divide-y divide-line">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${encodeURIComponent(p.slug)}`} className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:gap-8">
                  {p.cover_url && (
                    <img
                      src={p.cover_url}
                      alt=""
                      loading="lazy"
                      className="h-28 w-full shrink-0 rounded-field border border-line object-cover sm:w-48"
                    />
                  )}
                  <div className="min-w-0">
                    <time className="text-xs text-muted-foreground sm:hidden" dateTime={p.published_at ?? undefined}>
                      {p.published_at ? formatJalali(new Date(p.published_at)) : ""}
                    </time>
                    <h2 className="font-semibold text-xl leading-9 text-foreground transition-colors duration-(--motion) ease-motion group-hover:text-accent-strong">
                      {p.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-7 text-muted-foreground">{p.excerpt}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      {p.published_at && (
                        <time className="hidden sm:inline" dateTime={p.published_at}>
                          {formatJalali(new Date(p.published_at))}
                        </time>
                      )}
                      {p.reading_minutes > 0 && <span>{fa(p.reading_minutes)} دقیقه مطالعه</span>}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <SitePagination page={page} totalPages={pages} basePath="/blog" />
        </>
      )}
    </div>
  );
}
