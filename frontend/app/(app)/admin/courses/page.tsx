"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiError, formatTomanFromRial, type CourseSummary } from "@/lib/api";
import { adminCreateCourse, adminPublishCourse, fetchAdmin } from "@/lib/admin";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  published: { label: "منتشرشده", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "warning" },
  archived: { label: "بایگانی", tone: "neutral" },
};

const EMPTY_FORM = {
  title: "", slug: "", summary: "", description_html: "", level: "beginner", price_toman: "",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = React.useState<CourseSummary[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState("");
  const [toggling, setToggling] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await fetchAdmin<{ data: CourseSummary[] }>("/admin/courses?per_page=50");
      setCourses(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت فهرست");
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminCreateCourse({
        title: form.title,
        slug: form.slug || form.title,
        summary: form.summary,
        description_html: form.description_html,
        level: form.level,
        price_rial: Number(form.price_toman || "0") * 10,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در ایجاد دوره");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(id: string, current: string) {
    setError("");
    setToggling(id);
    try {
      await adminPublishCourse(id, current !== "published");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setToggling("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="reveal text-xl leading-7 text-foreground">دوره‌ها</h1>
        <Button variant={showForm ? "outline" : "default"} onClick={() => setShowForm((s) => !s)}>
          {showForm ? "بستن فرم" : "دوره جدید"}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {showForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-medium">ثبت دوره تازه</h2>
          <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="عنوان" htmlFor="a-title" required className="sm:col-span-2">
              <Input id="a-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="نامک (خالی = خودکار)" htmlFor="a-slug">
              <Input id="a-slug" dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field label="قیمت (تومان)" htmlFor="a-price">
              <Input
                id="a-price"
                dir="ltr"
                inputMode="numeric"
                value={form.price_toman}
                onChange={(e) => setForm({ ...form, price_toman: e.target.value })}
              />
            </Field>
            <Field label="سطح" htmlFor="a-level">
              <Select id="a-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option value="beginner">مقدماتی</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">پیشرفته</option>
              </Select>
            </Field>
            <Field label="خلاصه" htmlFor="a-summary" className="sm:col-span-2">
              <Input id="a-summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </Field>
            <Field label="توضیحات (HTML)" htmlFor="a-desc" className="sm:col-span-2">
              <Textarea
                id="a-desc"
                dir="ltr"
                className="font-mono text-xs"
                value={form.description_html}
                onChange={(e) => setForm({ ...form, description_html: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                ایجاد دوره (پیش‌نویس)
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری فهرست دوره‌ها">
          <div className="h-5 w-1/3 animate-pulse rounded bg-accent" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-accent" />
        </Card>
      ) : courses.length === 0 ? (
        <EmptyState
          title="دوره‌ای ثبت نشده است"
          body="اولین دوره را با دکمهٔ «دوره جدید» بساز."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-border-variant px-5 py-3 text-xs text-muted-foreground">
            {fa(courses.length)} دوره
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 text-start font-medium">دوره</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">قیمت</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">وضعیت</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-variant">
              {courses.map((c) => {
                const status = STATUS_FA[c.status] ?? { label: c.status, tone: "neutral" as const };
                return (
                  <tr key={c.id} className="transition-colors hover:bg-muted">
                    <td className="px-5 py-3">
                      <Link
                        href={`/courses/${encodeURIComponent(c.slug)}`}
                        className="font-medium text-foreground hover:text-accent-strong"
                      >
                        {c.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                        /courses/{c.slug}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {c.price_rial === 0 ? "رایگان" : formatTomanFromRial(c.price_rial)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        size="sm"
                        variant={c.status === "published" ? "outline" : "default"}
                        loading={toggling === c.id}
                        onClick={() => togglePublish(c.id, c.status)}
                      >
                        {c.status === "published" ? "لغو انتشار" : "انتشار"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
