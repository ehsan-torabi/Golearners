import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTomanFromRial } from "@/lib/api";
import { fa, faPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "پنل مدیریت", robots: { index: false } };
export const dynamic = "force-dynamic";

interface Summary {
  revenue_rial: number;
  orders_count: number;
  paid_orders: number;
  new_users: number;
  payment_success_pct: number;
}
interface CourseStat {
  slug: string; title: string; enrollments: number; revenue_rial: number;
}

export default async function AdminPage() {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  const base = process.env.API_INTERNAL ?? "http://localhost:8080";
  const auth = { headers: { Cookie: `gl_at=${access}` }, cache: "no-store" as const };
  let summary: Summary | null = null;
  let top: CourseStat[] = [];
  let forbidden = false;
  let loadError = false;
  try {
    const res = await fetch(`${base}/api/v1/admin/analytics/summary`, auth);
    if (res.status === 403 || res.status === 401) forbidden = true;
    else if (res.ok) {
      summary = (await res.json()) as Summary;
      const coursesRes = await fetch(`${base}/api/v1/admin/analytics/courses`, auth);
      if (coursesRes.ok) top = (await coursesRes.json()) as CourseStat[];
    } else loadError = true;
  } catch {
    loadError = true; // old code swallowed failures and rendered an empty dashboard
  }

  if (forbidden) {
    return (
      <Card className="mx-auto max-w-md p-10 text-center text-muted-foreground">
        این بخش فقط برای مدیران است.
      </Card>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        className="mt-10"
        title="داده‌های مدیریت بارگذاری نشد"
        body="ارتباط با سرور برقرار نشد. صفحه را دوباره باز کن؛ اگر تکرار شد، از وضعیت سرویس باخبر شو."
      />
    );
  }

  const stats: [string, string][] = summary
    ? [
        ["درآمد", formatTomanFromRial(summary.revenue_rial)],
        ["سفارش‌ها", fa(summary.orders_count)],
        ["پرداخت موفق", fa(summary.paid_orders)],
        ["نرخ موفقیت درگاه", faPercent(summary.payment_success_pct)],
      ]
    : [];

  return (
    <div className="space-y-8">
      <header className="reveal">
        <h1 className="font-display text-3xl">پنل مدیریت</h1>
        <nav className="mt-4 flex gap-5 border-b border-line text-sm" aria-label="بخش‌های مدیریت">
          {[
            ["/admin/courses", "دوره‌ها"],
            ["/admin/orders", "سفارش‌ها"],
            ["/admin/users", "کاربران"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="-mb-px border-b-2 border-transparent pb-3 text-muted-foreground transition-colors duration-(--motion) ease-motion hover:border-accent-display hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {summary && (
        <dl className="grid grid-cols-2 divide-line rounded-surface border border-line bg-card sm:grid-cols-4 sm:divide-x sm:divide-x-reverse">
          {stats.map(([label, value]) => (
            <div key={label} className="p-5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-display text-xl text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <Card className="p-6">
        <h2 className="font-display text-lg">پرفروش‌ترین دوره‌ها</h2>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            هنوز فروشی ثبت نشده؛ با اولین سفارش، این فهرست پر می‌شود.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {top.map((s) => (
              <li key={s.slug} className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-foreground">{s.title}</span>
                <span className="shrink-0 text-muted-foreground">
                  {fa(s.enrollments)} دانشجو، {formatTomanFromRial(s.revenue_rial)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs leading-6 text-muted-foreground">
        ساختار دوره‌ها (فصل‌ها، درس‌ها، رسانه‌ها) فعلاً از API مدیریت انجام می‌شود؛ رابط کامل آن در فاز بعد اضافه می‌شود.
      </p>
    </div>
  );
}
