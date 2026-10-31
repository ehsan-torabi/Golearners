import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { fa, faPercent, formatTomanFromRial } from "@/lib/utils";

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
  let summary: Summary | null = null;
  let top: CourseStat[] = [];
  let forbidden = false;
  try {
    const res = await fetch(`${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/admin/analytics/summary`, {
      headers: { Cookie: `gl_at=${access}` }, cache: "no-store",
    });
    if (res.status === 403 || res.status === 401) forbidden = true;
    else if (res.ok) {
      summary = (await res.json()) as Summary;
      top = (await (
        await fetch(`${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/admin/analytics/courses`, {
          headers: { Cookie: `gl_at=${access}` }, cache: "no-store",
        })
      ).json()) as CourseStat[];
    }
  } catch {
    forbidden = false;
  }

  if (forbidden) {
    return (
      <Card className="mx-auto max-w-md p-10 text-center text-muted-foreground">
        این بخش فقط برای مدیران است.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">پنل مدیریت</h1>
        <nav className="flex gap-2 text-sm" aria-label="بخش‌های مدیریت">
          {[
            ["/admin/courses", "دوره‌ها"],
            ["/admin/orders", "سفارش‌ها"],
            ["/admin/users", "کاربران"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="glass rounded-control px-4 py-2 transition-colors duration-(--motion) ease-motion hover:bg-accent">
              {label}
            </a>
          ))}
        </nav>
      </div>
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["درآمد", formatTomanFromRial(summary.revenue_rial)],
            ["سفارش‌ها", fa(summary.orders_count)],
            ["پرداخت موفق", fa(summary.paid_orders)],
            ["نرخ موفقیت درگاه", faPercent(summary.payment_success_pct)],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </Card>
          ))}
        </div>
      )}
      <Card className="p-6">
        <h2 className="font-display text-base">پرفروش‌ترین دوره‌ها</h2>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">هنوز داده‌ای نیست.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {top.map((s) => (
              <li key={s.slug} className="flex items-center justify-between py-2">
                <span>{s.title}</span>
                <span className="text-muted-foreground">
                  {fa(s.enrollments)} دانشجو • {formatTomanFromRial(s.revenue_rial)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">
        ویرایش دوره‌ها، سفارش‌ها و کاربران فعلاً از API پنل مدیریت انجام می‌شود؛ رابط کامل مدیریت در فاز بعدی تکمیل می‌شود.
      </p>
    </div>
  );
}
