"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ApiError,
  adminCreateBlogCategory,
  adminCreateCategory,
  adminDeleteBlogCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateBlogCategory,
  adminUpdateCategory,
  fetchBlogTaxonomy,
  type TaxonomyItem,
} from "@/lib/admin";
import { fa } from "@/lib/utils";

type Row = { id: string; slug: string; title: string; position: number };

export default function AdminCategoriesPage() {
  const [courseCategories, setCourseCategories] = React.useState<Row[]>([]);
  const [blogCategories, setBlogCategories] = React.useState<Row[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [draft, setDraft] = React.useState({ course: "", blog: "" });
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editPosition, setEditPosition] = React.useState("0");
  const [removing, setRemoving] = React.useState<{ id: string; title: string; scope: "course" | "blog" } | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const [courses, taxonomy] = await Promise.all([
        adminListCategories(),
        fetchBlogTaxonomy(),
      ]);
      setCourseCategories(courses.data ?? []);
      setBlogCategories(
        (taxonomy.categories ?? []).map((c) => ({ ...c, position: c.position ?? 0 })),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت دسته‌بندی‌ها");
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setError("");
    setBusy(key);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "انجام عملیات ناموفق بود.");
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!removing) return;
    await run(`delete-${removing.id}`, async () => {
      if (removing.scope === "course") {
        await adminDeleteCategory(removing.id);
      } else {
        await adminDeleteBlogCategory(removing.id);
      }
      setRemoving(null);
    });
  }

  function renderRows(rows: Row[], scope: "course" | "blog") {
    if (!loaded) {
      return (
        <div className="space-y-3 p-6" aria-label="در حال بارگذاری دسته‌بندی‌ها">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <EmptyState
          title="دسته‌بندی‌ای ثبت نشده است"
          body="نام دسته را بالا بنویسید و «افزودن» را بزنید."
        />
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">عنوان</TableHead>
            <TableHead className="text-start">نامک</TableHead>
            <TableHead className="text-start">ترتیب</TableHead>
            <TableHead className="text-start">کنش‌ها</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-start">
                {editing === row.id ? (
                  <Input
                    value={editTitle}
                    aria-label="عنوان دسته"
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 max-w-64"
                  />
                ) : (
                  <span className="font-medium text-foreground">{row.title}</span>
                )}
              </TableCell>
              <TableCell className="text-start text-xs text-muted-foreground" dir="ltr">
                {row.slug}
              </TableCell>
              <TableCell className="text-start text-muted-foreground">
                {editing === row.id ? (
                  <Input
                    value={editPosition}
                    aria-label="ترتیب دسته"
                    dir="ltr"
                    inputMode="numeric"
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="h-7 w-20"
                  />
                ) : (
                  fa(row.position)
                )}
              </TableCell>
              <TableCell className="text-start">
                <div className="flex flex-wrap items-center gap-1">
                  {editing === row.id ? (
                    <>
                      <Button
                        size="sm"
                        loading={busy === `save-${row.id}`}
                        onClick={() =>
                          void run(`save-${row.id}`, async () => {
                            const position = Number(editPosition || "0") || 0;
                            if (scope === "course") {
                              await adminUpdateCategory(row.id, editTitle.trim() || row.title, position);
                            } else {
                              await adminUpdateBlogCategory(row.id, editTitle.trim() || row.title, position);
                            }
                            setEditing(null);
                          })
                        }
                      >
                        ذخیره
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        انصراف
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(row.id);
                          setEditTitle(row.title);
                          setEditPosition(String(row.position));
                        }}
                      >
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive-text"
                        onClick={() => setRemoving({ id: row.id, title: row.title, scope })}
                      >
                        حذف
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="reveal text-xl leading-7 text-foreground">دسته‌بندی‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          دسته‌های دوره‌ها و دسته‌های وبلاگ. نامک به‌صورت خودکار از عنوان ساخته می‌شود.
        </p>
      </header>

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <Tabs defaultValue="course">
          <div className="border-b border-border-variant px-5">
            <TabsList variant="line" className="h-11 w-full justify-start gap-5 p-0">
              <TabsTrigger value="course">دسته‌های دوره</TabsTrigger>
              <TabsTrigger value="blog">دسته‌های وبلاگ</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="course">
            <div className="flex flex-wrap items-end gap-2 border-b border-border-variant px-5 py-3">
              <div className="min-w-56 flex-1">
                <label htmlFor="course-cat" className="mb-1.5 block text-sm font-medium">
                  دستهٔ تازه
                </label>
                <Input
                  id="course-cat"
                  value={draft.course}
                  placeholder="مثلاً: برنامه‌نویسی وب"
                  onChange={(e) => setDraft((d) => ({ ...d, course: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const title = draft.course.trim();
                      if (!title) return;
                      void run("add-course", async () => {
                        await adminCreateCategory(title, courseCategories.length);
                        setDraft((d) => ({ ...d, course: "" }));
                      });
                    }
                  }}
                />
              </div>
              <Button
                loading={busy === "add-course"}
                disabled={!draft.course.trim()}
                onClick={() =>
                  void run("add-course", async () => {
                    await adminCreateCategory(draft.course.trim(), courseCategories.length);
                    setDraft((d) => ({ ...d, course: "" }));
                  })
                }
              >
                افزودن
              </Button>
            </div>
            {renderRows(courseCategories, "course")}
          </TabsContent>

          <TabsContent value="blog">
            <div className="flex flex-wrap items-end gap-2 border-b border-border-variant px-5 py-3">
              <div className="min-w-56 flex-1">
                <label htmlFor="blog-cat" className="mb-1.5 block text-sm font-medium">
                  دستهٔ تازه
                </label>
                <Input
                  id="blog-cat"
                  value={draft.blog}
                  placeholder="مثلاً: آموزش"
                  onChange={(e) => setDraft((d) => ({ ...d, blog: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const title = draft.blog.trim();
                      if (!title) return;
                      void run("add-blog", async () => {
                        await adminCreateBlogCategory(title, blogCategories.length);
                        setDraft((d) => ({ ...d, blog: "" }));
                      });
                    }
                  }}
                />
              </div>
              <Button
                loading={busy === "add-blog"}
                disabled={!draft.blog.trim()}
                onClick={() =>
                  void run("add-blog", async () => {
                    await adminCreateBlogCategory(draft.blog.trim(), blogCategories.length);
                    setDraft((d) => ({ ...d, blog: "" }));
                  })
                }
              >
                افزودن
              </Button>
            </div>
            {renderRows(blogCategories, "blog")}
          </TabsContent>
        </Tabs>
      </Card>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
            <AlertDialogDescription>
              «{removing?.title}» حذف می‌شود. دوره‌ها و نوشته‌های این دسته بدون دسته می‌مانند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === `delete-${removing?.id}`}
              onClick={() => void remove()}
            >
              حذف دسته‌بندی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
