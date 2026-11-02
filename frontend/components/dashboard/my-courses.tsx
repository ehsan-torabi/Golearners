"use client";

import * as React from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEVEL_FA, type CourseSummary } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

export interface MyCourse {
  course: CourseSummary;
  granted_at: string;
  progress_pct: number;
  resume_lesson_id: string | null;
}

type StatusFilter = "" | "learning" | "not-started" | "done";

/** The learner's course shelf with status tabs, search and sorting. */
export function MyCoursesPanel({ courses }: { courses: MyCourse[] }) {
  const [status, setStatus] = React.useState<StatusFilter>("");
  const [sort, setSort] = React.useState("recent");
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");

  const counts = {
    learning: courses.filter((c) => c.progress_pct > 0 && c.progress_pct < 100).length,
    "not-started": courses.filter((c) => c.progress_pct === 0).length,
    done: courses.filter((c) => c.progress_pct >= 100).length,
  };

  const visible = courses
    .filter((c) => {
      if (status === "learning" && !(c.progress_pct > 0 && c.progress_pct < 100)) return false;
      if (status === "not-started" && c.progress_pct !== 0) return false;
      if (status === "done" && c.progress_pct < 100) return false;
      if (search) {
        const hay = `${c.course.title} ${c.course.slug}`;
        return hay.includes(search);
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "progress") return b.progress_pct - a.progress_pct;
      if (sort === "title") return a.course.title.localeCompare(b.course.title, "fa");
      return b.granted_at.localeCompare(a.granted_at);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-full flex-1 overflow-x-auto">
          <Tabs
            value={status}
            onValueChange={(v) => setStatus(v as StatusFilter)}
          >
            <TabsList variant="line" className="h-9 gap-4 p-0">
              <TabsTrigger value="">همه ({fa(courses.length)})</TabsTrigger>
              <TabsTrigger value="learning">در جریان ({fa(counts.learning)})</TabsTrigger>
              <TabsTrigger value="not-started">شروع‌نشده ({fa(counts["not-started"])})</TabsTrigger>
              <TabsTrigger value="done">تمام‌شده ({fa(counts.done)})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <form
          className="ms-auto flex flex-wrap items-end gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query.trim());
          }}
        >
          <div>
            <label htmlFor="my-course-q" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              جست‌وجو
            </label>
            <Input
              id="my-course-q"
              value={query}
              placeholder="عنوان دوره"
              className="w-48"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="my-course-sort" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              ترتیب
            </label>
            <Select
              id="my-course-sort"
              value={sort}
              className="w-40"
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">تازه‌ترین خرید</option>
              <option value="progress">بیشترین پیشرفت</option>
              <option value="title">عنوان</option>
            </Select>
          </div>
          <ButtonLink variant="outline" href="/courses">
            فروشگاه دوره‌ها
          </ButtonLink>
        </form>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={courses.length === 0 ? "هنوز دوره‌ای نخریده‌ای" : "دوره‌ای با این فیلترها نیست"}
          body={
            courses.length === 0
              ? "با اولین خرید، دوره اینجا اضافه می‌شود و یادگیری را از همان‌جا شروع می‌کنی."
              : "فیلترها را تغییر دهید یا همه را ببینید."
          }
          actionHref="/courses"
          actionLabel="دیدن دوره‌ها"
        />
      ) : (
        <div className="space-y-3">
          {visible.map((mc) => (
            <Card key={mc.course.id} className="p-0 transition-[box-shadow,border-color] duration-(--motion) ease-motion hover:border-primary/35 hover:shadow-raise">
              <div className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5">
                {/* honest cover placeholder (R-23): tinted chip with the initials */}
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-surface bg-primary-tint font-display text-lg font-semibold text-primary/45"
                >
                  {mc.course.title.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-medium leading-6">
                    <Link
                      href={`/dashboard/courses/${encodeURIComponent(mc.course.slug)}`}
                      className="transition-colors duration-150 hover:text-accent-strong"
                    >
                      {mc.course.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[
                      LEVEL_FA[mc.course.level],
                      mc.granted_at ? `خرید در ${formatJalali(new Date(mc.granted_at))}` : null,
                    ]
                      .filter(Boolean)
                      .join("، ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-lg font-semibold text-accent-strong" aria-hidden>
                    {fa(mc.progress_pct)}٪
                  </span>
                  <ButtonLink
                    href={`/dashboard/courses/${encodeURIComponent(mc.course.slug)}`}
                    size="sm"
                  >
                    {mc.progress_pct > 0 ? "ادامه یادگیری" : "شروع دوره"}
                  </ButtonLink>
                </div>
              </div>
              <div
                className="mx-4 mb-4 h-1.5 overflow-hidden rounded-full bg-accent sm:mx-5 sm:mb-5"
                role="progressbar"
                aria-valuenow={mc.progress_pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`پیشرفت دوره ${mc.course.title}`}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${mc.progress_pct}%` }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
