"use client";

import * as React from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Pencil } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, adminCourseStatsDetail, type CourseStatsDetail } from "@/lib/admin";
import { formatTomanFromRial, LEVEL_FA } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa, faDuration, faNumber, faPercent } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  published: { label: "منتشرشده", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "warning" },
  archived: { label: "بایگانی", tone: "neutral" },
};

const SOURCE_FA: Record<string, string> = {
  purchase: "خرید",
  grant: "هدیه",
  refund_reversed: "بازگشت وجه",
};

const chartConfig = {
  enrollments: { label: "ثبت‌نام", color: "var(--primary)" },
  revenue: { label: "درآمد (تومان)", color: "var(--primary)" },
  watch: { label: "تماشا (دقیقه)", color: "var(--primary)" },
} satisfies ChartConfig;

/** A figure with its label; the band under the headline row. */
function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-7 text-foreground tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CourseStats({ courseId }: { courseId: string }) {
  const [detail, setDetail] = React.useState<CourseStatsDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminCourseStatsDetail(courseId)
      .then((res) => {
        if (cancelled) return;
        setDetail(res.data);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "خطا در دریافت آمار دوره");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, nonce]);

  if (loading) {
    return (
      <div className="space-y-4" aria-label="در حال بارگذاری آمار دوره">
        <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
        <div className="h-36 animate-pulse rounded bg-muted" />
        <div className="h-56 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">
          ← بازگشت به فهرست دوره‌ها
        </Link>
        <Alert>{error || "آمار دوره بارگذاری نشد."}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">
            ← بازگشت به فهرست دوره‌ها
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="reveal text-xl leading-7 text-foreground">{detail.course.title}</h1>
            <Badge tone={STATUS_FA[detail.course.status]?.tone ?? "neutral"}>
              {STATUS_FA[detail.course.status]?.label ?? detail.course.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {LEVEL_FA[detail.course.level as keyof typeof LEVEL_FA] ?? detail.course.level}
            {detail.course.published_at
              ? ` · انتشار ${formatJalali(new Date(detail.course.published_at))}`
              : " · منتشر نشده"}
          </p>
        </div>
        <ButtonLink size="sm" variant="outline" href={`/admin/courses/${detail.course.course_id}`}>
          <Pencil />
          ویرایش دوره
        </ButtonLink>
      </header>

      <KpiBand detail={detail} />
      <TrendCharts detail={detail} />
      <Engagement detail={detail} />
    </div>
  );
}

/** The headline figures: what the course earned, and how many people it holds. */
function KpiBand({ detail }: { detail: CourseStatsDetail }) {
  const m = detail.metrics;
  if (m.lessons === 0 && m.enrollments === 0 && m.watch_seconds === 0) {
    return (
      <EmptyState
        title="این دوره هنوز داده‌ای ندارد"
        body="به‌محض ثبت‌نام یا تماشا، شاخص‌های این دوره اینجا نمایش داده می‌شوند."
      />
    );
  }
  return (
    <Card className="p-5">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground">درآمد کل</p>
          <p className="mt-1 text-3xl font-semibold leading-9 text-foreground tabular-nums">
            {formatTomanFromRial(m.revenue_rial)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {m.refund_rial > 0
              ? `پس از بازپرداخت ${formatTomanFromRial(m.net_revenue_rial)}`
              : "بدون بازپرداخت"}
          </p>
        </div>
        <Figure
          label="دانشجو"
          value={fa(m.enrollments)}
          hint={`${fa(m.paid_enrollments)} خریداری · ${fa(m.granted_enrollments)} هدیه`}
        />
        <Figure
          label="فعال (۳۰ روز)"
          value={fa(m.active_learners)}
          hint={`${fa(m.started_learners)} نفر شروع کرده`}
        />
        <Figure
          label="زمان تماشا"
          value={faDuration(m.watch_seconds)}
          hint={`${fa(m.watch_learners)} نفر تماشا کرده`}
        />
      </div>
      <div className="mt-5 grid gap-4 border-t border-border-variant pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <Figure
          label="سفارش پرداخت‌شده"
          value={fa(m.orders)}
          hint={`${fa(m.buyers)} خریدار`}
        />
        <Figure
          label="میانگین امتیاز"
          value={m.review_count > 0 ? `${fa(m.avg_rating)} از ۵` : "بدون نظر"}
          hint={`${fa(m.review_count)} نظر تأییدشده`}
        />
        <Figure
          label="نرخ تکمیل"
          value={faPercent(m.completion_pct)}
          hint={`${fa(m.completed_lessons)} درس تمام‌شده`}
        />
        <Figure
          label="محتوا"
          value={`${fa(m.lessons)} درس`}
          hint={`${fa(m.sections)} بخش · ${faDuration(m.duration_seconds)}`}
        />
      </div>
    </Card>
  );
}

/** «۲۵ شهریور» — the axis label; the tooltip keeps the full Jalali date. */
function shortJalali(full: string): string {
  const parts = full.split(" ").filter(Boolean);
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : full;
}

/** The 60-day trend: what grew, what it earned, and how long it was watched. */
function TrendCharts({ detail }: { detail: CourseStatsDetail }) {
  const s = detail.series;
  const data = s.days.map((day, i) => ({
    label: formatJalali(new Date(day)),
    enrollments: s.enrollments[i] ?? 0,
    revenue: Math.round((s.revenue_rial[i] ?? 0) / 10),
    watch: Math.round((s.watch_seconds[i] ?? 0) / 60),
  }));
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const enrolled = sum(s.enrollments);
  const revenue = sum(s.revenue_rial);
  const watch = sum(s.watch_seconds);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <ChartHead title="ثبت‌نام در ۶۰ روز اخیر" value={`${fa(enrolled)} ثبت‌نام`} empty={enrolled === 0} />
        <ChartContainer config={chartConfig} className="mt-3 h-56 w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={shortJalali}
            />
            <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => faNumber(Number(v))} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      <Card className="p-5">
        <ChartHead
          title="درآمد در ۶۰ روز اخیر"
          value={formatTomanFromRial(revenue)}
          empty={revenue === 0}
        />
        <ChartContainer config={chartConfig} className="mt-3 h-56 w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={shortJalali}
            />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => faNumber(Number(v))} />
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(value) => formatTomanFromRial(Number(value) * 10)} />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <ChartHead
          title="زمان تماشا در ۶۰ روز اخیر"
          value={faDuration(watch)}
          empty={watch === 0}
        />
        <ChartContainer config={chartConfig} className="mt-3 h-56 w-full">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={shortJalali}
            />
            <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => faNumber(Number(v))} />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => faDuration(Number(value) * 60)} />}
            />
            <Area
              dataKey="watch"
              type="monotone"
              stroke="var(--color-watch)"
              fill="var(--color-watch)"
              fillOpacity={0.12}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </Card>
    </section>
  );
}

/** Chart title, the window total, and the honest note when the window is dry. */
function ChartHead({ title, value, empty }: { title: string; value: string; empty: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{value}</span>
      </div>
      {empty && (
        <p className="mt-1 text-xs text-muted-foreground">در این بازه رویدادی ثبت نشده است.</p>
      )}
    </div>
  );
}

/** Where the learners drop off, plus how they enrolled and what they said. */
function Engagement({ detail }: { detail: CourseStatsDetail }) {
  const sources = Object.entries(detail.sources);
  const sourceTotal = sources.reduce((a, [, count]) => a + count, 0);

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card className="p-0">
        <div className="border-b border-border-variant px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">پیشرفت در درس‌ها</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            هر درس چند نفر را شروع کرده و چند نفر آن را تمام کرده‌اند
          </p>
        </div>
        {detail.lessons.length === 0 ? (
          <EmptyState
            title="این دوره هنوز درسی ندارد"
            body="پس از افزودن درس، آمار پیشرفت دانشجوها اینجا نمایش داده می‌شود."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">درس</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">شروع</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">تکمیل</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">تماشا</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">میانگین پیشرفت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.lessons.map((l) => (
                <TableRow key={l.lesson_id}>
                  <TableCell className="text-start whitespace-normal">
                    <p className="truncate font-medium text-foreground">{l.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.section_title}</p>
                  </TableCell>
                  <TableCell className="text-start tabular-nums">{fa(l.started)}</TableCell>
                  <TableCell className="text-start tabular-nums">{faPercent(l.completion_pct)}</TableCell>
                  <TableCell className="text-start tabular-nums text-muted-foreground">
                    {faDuration(l.watch_seconds)}
                  </TableCell>
                  <TableCell className="text-start tabular-nums">{faPercent(l.avg_position_pct)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">منبع ثبت‌نام</h2>
          {sourceTotal === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">هنوز دانشجویی ثبت‌نام نکرده است.</p>
          ) : (
            sources.map(([key, count]) => (
              <div key={key} className="mt-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-foreground">{SOURCE_FA[key] ?? key}</span>
                  <span className="text-muted-foreground tabular-nums">{fa(count)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((count / sourceTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">آخرین نظرها</h2>
          {detail.reviews.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">هنوز نظری برای این دوره ثبت نشده است.</p>
          ) : (
            detail.reviews.map((r) => (
              <div key={r.id} className="mt-3 border-t border-border-variant pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {r.user_name || "دانشجو"}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {fa(r.rating)} از ۵
                  </span>
                </div>
                {r.body && <p className="mt-1 text-xs leading-6 text-muted-foreground">{r.body}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatJalali(new Date(r.created_at))}
                  {r.status === "pending" ? " · در انتظار تأیید" : ""}
                </p>
              </div>
            ))
          )}
        </Card>
      </div>
    </section>
  );
}



