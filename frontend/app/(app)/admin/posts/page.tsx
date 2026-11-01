"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ApiError } from "@/lib/api";
import { adminPublishPost, fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

interface PostRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  created_at: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = React.useState<PostRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const res = await fetchAdmin<{ data: PostRow[] }>("/admin/posts?per_page=50");
      setPosts(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت نوشته‌ها");
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function togglePublish(p: PostRow) {
    setError("");
    setBusy(p.id);
    try {
      await adminPublishPost(p.id, p.status !== "published");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="reveal text-xl leading-7 text-foreground">نوشته‌های وبلاگ</h1>
      {error && <Alert>{error}</Alert>}
      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری نوشته‌ها">
          <div className="h-5 w-1/3 animate-pulse rounded bg-accent" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-accent" />
        </Card>
      ) : posts.length === 0 ? (
        <EmptyState
          title="نوشته‌ای ثبت نشده است"
          body="نوشته‌های وبلاگ از همین‌جا مدیریت می‌شوند؛ ساخت نوشته در API مدیریت انجام می‌شود."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">عنوان</TableHead>
                  <TableHead className="text-start">تاریخ</TableHead>
                  <TableHead className="text-start">وضعیت</TableHead>
                  <TableHead className="text-start">عملیات</TableHead>
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
                      <Button
                        size="sm"
                        variant={p.status === "published" ? "outline" : "default"}
                        loading={busy === p.id}
                        onClick={() => togglePublish(p)}
                      >
                        {p.status === "published" ? "لغو انتشار" : "انتشار"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </table>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">{fa(posts.length)} نوشته</p>
    </div>
  );
}
