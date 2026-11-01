"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PostEditor } from "@/components/admin/post-editor";
import {
  ApiError,
  adminDeletePost,
  adminPublishPost,
  fetchAdmin,
  type AdminPost,
} from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
];

export default function AdminPostsPage() {
  const [posts, setPosts] = React.useState<AdminPost[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<AdminPost | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      const res = await fetchAdmin<{ data: AdminPost[]; meta: { total: number } }>(
        `/admin/posts?${params}`,
      );
      setPosts(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت نوشته‌ها");
    } finally {
      setLoaded(true);
    }
  }, [page, status, search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function togglePublish(post: AdminPost) {
    setError("");
    setBusy(post.id);
    try {
      await adminPublishPost(post.id, post.status !== "published");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!removing) return;
    setError("");
    setBusy(removing.id);
    try {
      await adminDeletePost(removing.id);
      setRemoving(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف نوشته");
    } finally {
      setBusy("");
    }
  }

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reveal text-xl leading-7 text-foreground">نوشته‌های وبلاگ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loaded ? `${fa(total)} نوشته ثبت شده است.` : "در حال شمارش نوشته‌ها…"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          نوشتهٔ تازه
        </Button>
      </header>

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-variant px-4 py-3">
          <Tabs
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <TabsList variant="line" className="h-9 gap-4 p-0">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <form
            className="ms-auto flex items-center gap-2"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(query.trim());
              setPage(1);
            }}
          >
            <label htmlFor="post-q" className="sr-only">
              جست‌وجوی نوشته
            </label>
            <Input
              id="post-q"
              value={query}
              placeholder="عنوان یا نامک نوشته"
              className="w-56"
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" variant="outline">
              جست‌وجو
            </Button>
          </form>
        </div>

        {!loaded ? (
          <div className="space-y-3 p-6" aria-label="در حال بارگذاری نوشته‌ها">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="نوشته‌ای با این فیلترها نیست"
            body="فیلترها را تغییر دهید یا نوشتهٔ تازه‌ای بنویسید."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">نوشته</TableHead>
                <TableHead className="text-start">تاریخ</TableHead>
                <TableHead className="text-start">وضعیت</TableHead>
                <TableHead className="text-start">کنش‌ها</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-start">
                    <Link
                      href={`/blog/${encodeURIComponent(p.slug)}`}
                      className="font-medium text-foreground hover:text-accent-strong"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                      /blog/{p.slug}
                    </p>
                  </TableCell>
                  <TableCell className="text-start text-muted-foreground">
                    {formatJalali(new Date(p.published_at ?? p.created_at))}
                  </TableCell>
                  <TableCell className="text-start">
                    <Badge tone={p.status === "published" ? "success" : "warning"}>
                      {p.status === "published" ? "منتشرشده" : "پیش‌نویس"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-start">
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(p.id);
                          setEditorOpen(true);
                        }}
                      >
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busy === p.id}
                        onClick={() => void togglePublish(p)}
                      >
                        {p.status === "published" ? "لغو انتشار" : "انتشار"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRemoving(p)}>
                        حذف
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {loaded && total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border-variant px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              صفحهٔ {fa(page)} از {fa(pages)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        )}
      </Card>

      <PostEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        postId={editing}
        onSaved={() => void load()}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نوشته</AlertDialogTitle>
            <AlertDialogDescription>
              «{removing?.title}» برای همیشه حذف می‌شود و از وبلاگ برداشته خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === removing?.id}
              onClick={() => void remove()}
            >
              حذف نوشته
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
