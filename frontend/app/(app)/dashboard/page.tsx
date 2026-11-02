import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MyCoursesPanel, type MyCourse } from "@/components/dashboard/my-courses";
import { MyOrdersPanel, type OrderRow } from "@/components/dashboard/my-orders";
import { getMe } from "@/lib/me-server";
import { fa } from "@/lib/utils";
import { formatJalali } from "@/lib/jalali";

export const metadata: Metadata = { title: "داشبورد", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROLE_FA: Record<string, string> = { learner: "دانشجو", admin: "مدیر", instructor: "مدرس" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");
}

export default async function DashboardPage() {
  const [me, courses, orders] = await Promise.all([getMe(), myCourses(), myOrders()]);

  if (!me) {
    return (
      <EmptyState
        className="mt-10"
        title="برای دیدن داشبورد ابتدا وارد شو"
        body="پس از ورود، دوره‌ها و پیشرفت یادگیری همین‌جا دیده می‌شود."
        actionHref="/login"
        actionLabel="ورود به حساب"
      />
    );
  }

  const inProgress = courses.filter((c) => c.progress_pct > 0 && c.progress_pct < 100).length;
  const completed = courses.filter((c) => c.progress_pct >= 100).length;
  const avg = courses.length
    ? Math.round(courses.reduce((s, c) => s + c.progress_pct, 0) / courses.length)
    : 0;
  const stats: [string, string][] = [
    ["دوره‌ها", fa(courses.length)],
    ["در حال یادگیری", fa(inProgress)],
    ["تکمیل‌شده", fa(completed)],
    ["میانگین پیشرفت", fa(avg) + "٪"],
  ];

  return (
    <div className="space-y-6">
      {/* account header, «حساب کاربری» style: identity row over the learning stats */}
      <Card className="reveal overflow-hidden p-0">
        <div className="hero-band flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center">
          <Avatar className="size-16 border-2 border-card shadow-raise">
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">
              {initials(me.full_name) || "گ"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-xl leading-7 text-foreground">{me.full_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
              {me.mobile}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              عضو از {formatJalali(new Date(me.created_at))}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
            {me.roles.map((r) => (
              <span
                key={r}
                className="rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong"
              >
                {ROLE_FA[r] ?? r}
              </span>
            ))}
          </div>
        </div>

        {/* real learning stats */}
        <dl className="grid grid-cols-2 divide-border-variant border-t border-line sm:grid-cols-4 sm:divide-x sm:divide-x-reverse">
          {stats.map(([label, value]) => (
            <div key={label} className="p-5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {me.roles?.includes("admin") && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary-tint/40 p-5">
          <div>
            <p className="text-sm font-medium text-foreground">پنل مدیریت در دسترس است</p>
            <p className="mt-1 text-xs text-muted-foreground">
              دوره‌ها، سفارش‌ها، کاربران و محتوای سایت را از کنسول مدیریت ببین.
            </p>
          </div>
          <ButtonLink href="/admin" size="sm">
            رفتن به مدیریت
          </ButtonLink>
        </Card>
      )}

      <section aria-labelledby="my-courses" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 id="my-courses" className="text-xl leading-7 text-foreground">
            دوره‌های من
          </h2>
        </div>
        <MyCoursesPanel courses={courses} />
      </section>

      <section aria-labelledby="my-orders" className="space-y-4">
        <h2 id="my-orders" className="text-xl leading-7 text-foreground">
          سفارش‌های من
        </h2>
        <MyOrdersPanel orders={orders.data} total={orders.total} />
      </section>
    </div>
  );
}

async function myCourses(): Promise<MyCourse[]> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  try {
    const res = await fetch(`${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me/courses`, {
      headers: { Cookie: `gl_at=${access}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: MyCourse[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

interface OrdersPayload {
  data: OrderRow[];
  total: number;
}

async function myOrders(): Promise<OrdersPayload> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  try {
    const res = await fetch(
      `${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me/orders?per_page=5`,
      { headers: { Cookie: `gl_at=${access}` }, cache: "no-store" },
    );
    if (!res.ok) return { data: [], total: 0 };
    const body = (await res.json()) as { data: OrderRow[]; meta: { total: number } };
    return { data: body.data ?? [], total: body.meta?.total ?? 0 };
  } catch {
    return { data: [], total: 0 };
  }
}
