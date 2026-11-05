"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
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
  adminCreateSeries,
  adminDeleteSeries,
  adminListSeries,
  adminUpdateSeries,
  type AdminSeries,
} from "@/lib/admin";
import { fa } from "@/lib/utils";
import { ListHeader } from "@/components/admin/list-view";

/**
 * Series manager — ordered multi-part article collections (sisoog «شماره» model).
 * Slug is derived server-side from the title when left blank.
 */
export default function AdminSeriesPage() {
  const [rows, setRows] = React.useState<AdminSeries[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [draft, setDraft] = React.useState({ title: "", slug: "", description: "" });
  const [editing, setEditing] = React.useState<string | null>(null);
  const [edit, setEdit] = React.useState({ title: "", slug: "", description: "" });
  const [removing, setRemoving] = React.useState<AdminSeries | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await adminListSeries();
      setRows(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت سری‌ها");
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

  function startCreate() {
    const title = draft.title.trim();
    if (!title) return;
    void run("add", async () => {
      await adminCreateSeries({
        title,
        slug: draft.slug.trim(),
        description: draft.description.trim(),
      });
      setDraft({ title: "", slug: "", description: "" });
    });
  }

  return (
    <div className="space-y-4">
      <ListHeader
        title="سری‌های مطالب"
        count={rows.length}
        unit="سری"
        subtitle="مجموعه‌های چندقسمتی مثل «مهندسی معکوس با گیدرا». شمارهٔ هر قسمت هنگام ویرایش نوشته ست می‌شود."
      />

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <div className="flex flex-wrap items-end gap-2 border-b border-border-variant px-5 py-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="s-title" className="mb-1.5 block text-sm font-medium">
              سری تازه
            </label>
            <Input
              id="s-title"
              value={draft.title}
              placeholder="مثلاً: مهندسی معکوس با گیدرا"
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  startCreate();
                }
              }}
            />
          </div>
          <div className="w-44">
            <label htmlFor="s-slug" className="mb-1.5 block text-sm font-medium">
              نامک
            </label>
            <Input
              id="s-slug"
              dir="ltr"
              value={draft.slug}
              placeholder="خالی = از عنوان"
              onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
            />
          </div>
          <Button loading={busy === "add"} disabled={!draft.title.trim()} onClick={startCreate}>
            افزودن
          </Button>
        </div>

        {!loaded ? (
          <div className="space-y-3 p-6" aria-label="در حال بارگذاری سری‌ها">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="سری‌ای ثبت نشده است"
            body="عنوان سری را بالا بنویسید و «افزودن» را بزنید؛ سپس در ویرایش هر نوشته آن را انتخاب کنید."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">عنوان</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">نامک</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">نوشته‌ها</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">کنش‌ها</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-start font-medium text-foreground">
                    {editing === row.id ? (
                      <Input
                        value={edit.title}
                        aria-label="عنوان سری"
                        onChange={(e) => setEdit((v) => ({ ...v, title: e.target.value }))}
                        className="h-7 max-w-64"
                      />
                    ) : (
                      <div>
                        {row.title}
                        {row.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs font-normal text-muted-foreground">
                            {row.description}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-start text-xs text-muted-foreground" dir="ltr">
                    {editing === row.id ? (
                      <Input
                        value={edit.slug}
                        aria-label="نامک سری"
                        dir="ltr"
                        onChange={(e) => setEdit((v) => ({ ...v, slug: e.target.value }))}
                        className="h-7 w-44"
                      />
                    ) : (
                      row.slug
                    )}
                  </TableCell>
                  <TableCell className="text-start text-muted-foreground">{fa(row.posts_count)}</TableCell>
                  <TableCell className="text-start">
                    <div className="flex flex-wrap items-center gap-1">
                      {editing === row.id ? (
                        <>
                          <Button
                            size="sm"
                            loading={busy === `save-${row.id}`}
                            onClick={() =>
                              void run(`save-${row.id}`, async () => {
                                await adminUpdateSeries(row.id, {
                                  title: edit.title.trim() || row.title,
                                  slug: edit.slug.trim() || row.slug,
                                  description: edit.description.trim(),
                                });
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
                              setEdit({ title: row.title, slug: row.slug, description: row.description });
                            }}
                          >
                            ویرایش
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive-text"
                            disabled={row.posts_count > 0}
                            title={row.posts_count > 0 ? "ابتدا نوشته‌های این سری را جابه‌جا کنید." : undefined}
                            onClick={() => setRemoving(row)}
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
        )}
      </Card>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف سری</AlertDialogTitle>
            <AlertDialogDescription>
              «{removing?.title}» حذف می‌شود. این تنها وقتی ممکن است که هیچ نوشته‌ای به سری وابسته نباشد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === `delete-${removing?.id}`}
              onClick={() =>
                removing &&
                void run(`delete-${removing.id}`, async () => {
                  await adminDeleteSeries(removing.id);
                  setRemoving(null);
                })
              }
            >
              حذف سری
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
