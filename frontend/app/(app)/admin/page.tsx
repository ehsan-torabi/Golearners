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
  slug: string;
  title: string;
  enrollments: number;
  revenue_rial: number;
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
    loadError = true;
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

  const cards: { label: string; value: string; hint?: string }[] = summary
    ? [
        { label: "درآمد", value: formatTomanFromRial(summary.revenue_rial), hint: "کل سفارش‌های پرداخت‌شده" },
        { label: "سفارش‌ها", value: fa(summary.orders_count), hint: `${fa(summary.paid_orders)} پرداخت موفق` },
        { label: "نرخ موفقیت درگاه", value: faPercent(summary.payment_success_pct), hint: "از تلاش‌های پرداخت" },
        { label: "کاربران تازه", value: fa(summary.new_users), hint: "در بازهٔ گزارش" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="reveal text-xl leading-7 text-foreground">نمای کلی</h1>
        <p className="text-xs text-muted-foreground">داده‌های واقعی سیستم، بدون تخمین</p>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label} className="p-5">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="mt-2 text-2xl font-semibold leading-8 text-foreground">{c.value}</p>
              {c.hint && <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>}
            </Card>
          ))}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border-variant px-5 py-4">
          <h2 className="text-base font-medium text-foreground">پرفروش‌ترین دوره‌ها</h2>
          <Link href="/admin/courses" className="text-sm text-accent-strong hover:underline">
            مدیریت دوره‌ها
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            هنوز فروشی ثبت نشده؛ با اولین سفارش، این فهرست پر می‌شود.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 text-start font-medium">دوره</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">دانشجو</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">درآمد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-variant">
              {top.map((s) => (
                <tr key={s.slug} className="transition-colors hover:bg-muted">
                  <td className="px-5 py-3">
                    <Link
                      href={`/courses/${encodeURIComponent(s.slug)}`}
                      className="text-foreground hover:text-accent-strong"
                    >
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{fa(s.enrollments)}</td>
                  <td className="px-5 py-3 text-foreground">{formatTomanFromRial(s.revenue_rial)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="text-xs leading-6 text-muted-foreground">
        ساختار دوره‌ها (فصل‌ها، درس‌ها، رسانه‌ها) فعلاً از API مدیریت انجام می‌شود؛ رابط کامل آن در فاز بعد اضافه می‌شود.
      </p>
    </div>
  );
}
