"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
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
import { MediaUploader } from "@/components/admin/media-uploader";
import { adminDeleteMedia, adminListMedia, ApiError, type MediaAsset } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { faNumber } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" | "neutral" }> = {
  ready: { label: "آماده", tone: "success" },
  processing: { label: "در حال پردازش", tone: "warning" },
  failed: { label: "ناموفق", tone: "destructive" },
  uploaded: { label: "در صف پردازش", tone: "neutral" },
};

const KIND_FA: Record<string, string> = {
  image: "تصویر",
  video: "ویدیو",
  pdf: "PDF",
};

const PER_PAGE = 20;

export default function AdminMediaPage() {
  const [media, setMedia] = React.useState<MediaAsset[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [kind, setKind] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [uploadKind, setUploadKind] = React.useState<"image" | "video" | "pdf">("image");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [removing, setRemoving] = React.useState<MediaAsset | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await adminListMedia({
        page,
        per_page: PER_PAGE,
        kind,
        status,
        sort,
        q: search,
      });
      setMedia(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت رسانه‌ها");
    } finally {
      setLoaded(true);
    }
  }, [page, kind, status, sort, search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function remove() {
    if (!removing) return;
    setError("");
    setBusy(removing.id);
    try {
      await adminDeleteMedia(removing.id);
      setRemoving(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف رسانه");
    } finally {
      setBusy("");
    }
  }

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reveal text-xl leading-7 text-foreground">رسانه‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loaded ? `${faNumber(total)} فایل در کتابخانهٔ رسانه.` : "در حال شمارش فایل‌ها…"}
          </p>
        </div>
      </header>

      {error && <Alert>{error}</Alert>}

      <Card className="p-4">
        <div className="mb-3 max-w-56">
          <label htmlFor="m-upload-kind" className="mb-1.5 block text-sm font-medium">
            نوع فایل
          </label>
          <Select
            id="m-upload-kind"
            value={uploadKind}
            onChange={(e) => setUploadKind(e.target.value as "image" | "video" | "pdf")}
          >
            <option value="image">تصویر</option>
            <option value="video">ویدیو</option>
            <option value="pdf">PDF</option>
          </Select>
        </div>
        <MediaUploader
          key={uploadKind}
          kind={uploadKind}
          label="بارگذاری فایل تازه"
          onUploaded={() => {
            setLoaded(false);
            void load();
          }}
        />
      </Card>

      <Card className="p-0">
        <form
          className="flex flex-wrap items-end gap-3 border-b border-border-variant px-4 py-3"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query.trim());
            setPage(1);
          }}
        >
          <div>
            <label htmlFor="m-kind" className="mb-1.5 block text-sm font-medium">
              نوع
            </label>
            <Select
              id="m-kind"
              value={kind}
              className="w-36"
              onChange={(e) => {
                setKind(e.target.value);
                setPage(1);
              }}
            >
              <option value="">همه</option>
              <option value="image">تصویر</option>
              <option value="video">ویدیو</option>
              <option value="pdf">PDF</option>
            </Select>
          </div>
          <div>
            <label htmlFor="m-status" className="mb-1.5 block text-sm font-medium">
              وضعیت
            </label>
            <Select
              id="m-status"
              value={status}
              className="w-40"
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">همه</option>
              <option value="ready">آماده</option>
              <option value="uploaded">در صف پردازش</option>
              <option value="processing">در حال پردازش</option>
              <option value="failed">ناموفق</option>
            </Select>
          </div>
          <div>
            <label htmlFor="m-sort" className="mb-1.5 block text-sm font-medium">
              ترتیب
            </label>
            <Select
              id="m-sort"
              value={sort}
              className="w-44"
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="newest">تازه‌ترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="size_desc">بزرگ‌ترین</option>
              <option value="size_asc">کوچک‌ترین</option>
            </Select>
          </div>
          <div className="ms-auto">
            <label htmlFor="m-q" className="mb-1.5 block text-sm font-medium">
              جست‌وجوی نام فایل
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="m-q"
                value={query}
                placeholder="نام فایل"
                className="w-56"
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" variant="outline">
                جست‌وجو
              </Button>
            </div>
          </div>
        </form>

        {!loaded ? (
          <div className="space-y-3 p-6" aria-label="در حال بارگذاری رسانه‌ها">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
          </div>
        ) : media.length === 0 ? (
          <EmptyState
            title="رسانه‌ای با این فیلترها نیست"
            body="فیلترها را تغییر دهید یا فایل تازه‌ای بارگذاری کنید."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">فایل</TableHead>
                <TableHead className="text-start">نوع</TableHead>
                <TableHead className="text-start">حجم</TableHead>
                <TableHead className="text-start">مدت</TableHead>
                <TableHead className="text-start">وضعیت</TableHead>
                <TableHead className="text-start">تاریخ</TableHead>
                <TableHead className="text-start">کنش‌ها</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media.map((m) => {
                const statusMeta = STATUS_FA[m.status] ?? { label: m.status, tone: "neutral" as const };
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-start">
                      <p className="font-medium text-foreground" dir="ltr">
                        {m.storage_key.split("/").slice(-1)[0]}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                        {m.storage_key.split("/").slice(0, -1).join("/")}
                      </p>
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {KIND_FA[m.kind] ?? m.kind}
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {faNumber(Math.round(m.size_bytes / 1024))} کیلوبایت
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {m.kind === "video" && m.duration_seconds
                        ? `${faNumber(Math.round(m.duration_seconds / 60))} دقیقه`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {formatJalali(new Date(m.created_at))}
                    </TableCell>
                    <TableCell className="text-start">
                      <Button size="sm" variant="ghost" onClick={() => setRemoving(m)}>
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {loaded && total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border-variant px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              صفحهٔ {faNumber(page)} از {faNumber(pages)}
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

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف رسانه</AlertDialogTitle>
            <AlertDialogDescription>
              فایل «{removing?.storage_key.split("/").slice(-1)[0]}» از کتابخانه حذف می‌شود. اگر در
              دوره یا درسی استفاده شده باشد، دیگر پخش نمی‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === removing?.id}
              onClick={() => void remove()}
            >
              حذف رسانه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
