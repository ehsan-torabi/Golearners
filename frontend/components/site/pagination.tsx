import Link from "next/link";
import { fa } from "@/lib/utils";

/**
 * Server-rendered pagination for the public lists: plain links that keep the
 * current filters in the query string, so it works without JavaScript.
 * Current page is highlighted; out-of-range steps render as text, not links.
 */
export function SitePagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    if (target > 1) sp.set("page", String(target));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // window: first … current±1 … last, gaps collapsed to single ellipses
  const items: (number | "…")[] = [];
  const push = (item: number | "…") => {
    if (items[items.length - 1] !== item) items.push(item);
  };
  const lo = Math.max(2, page - 1);
  const hi = Math.min(totalPages - 1, page + 1);
  push(1);
  if (lo > 2) push("…");
  for (let p = lo; p <= hi; p++) push(p);
  if (hi < totalPages - 1) push("…");
  if (totalPages > 1) push(totalPages);

  const linkCls =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground";
  const currentCls =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-primary-tint px-2.5 text-sm font-medium text-accent-strong";

  return (
    <nav aria-label="صفحه‌بندی" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkCls} rel="prev">
          قبلی
        </Link>
      ) : (
        <span aria-disabled="true" className={linkCls + " cursor-not-allowed opacity-50"}>
          قبلی
        </span>
      )}

      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={currentCls}>
            {fa(item)}
          </span>
        ) : (
          <Link key={item} href={hrefFor(item)} className={linkCls} aria-label={`صفحهٔ ${fa(item)}`}>
            {fa(item)}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkCls} rel="next">
          بعدی
        </Link>
      ) : (
        <span aria-disabled="true" className={linkCls + " cursor-not-allowed opacity-50"}>
          بعدی
        </span>
      )}
    </nav>
  );
}
