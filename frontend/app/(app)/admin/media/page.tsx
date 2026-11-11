"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ExternalLink, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DetailCard,
  DetailGrid,
  DetailItem,
  DetailSection,
  ListDetailRow,
  ListHeader,
  ListLoading,
  ListPagination,
  ListThumb,
  ListToolbar,
  RowMenu,
  useAdminList,
  useFacetCounts,
  type ListChip,
  ListError,
} from "@/components/admin/list-view";
import { MediaUploader } from "@/components/admin/media-uploader";
import { adminDeleteMedia, ApiError, type MediaAsset } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa, faNumber } from "@/lib/utils";

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

const STATUS_VALUES = ["ready", "uploaded", "processing", "failed"];

const KIND_VALUES = ["image", "video", "pdf"];

const SORT_OPTIONS = [
  { value: "newest", label: "تازه‌ترین" },
  { value: "oldest", label: "قدیمی‌ترین" },
  { value: "size_desc", label: "بزرگ‌ترین" },
  { value: "size_asc", label: "کوچک‌ترین" },
];

export default function AdminMediaPage() {
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [kind, setKind] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [uploadKind, setUploadKind] = React.useState<"image" | "video" | "pdf">("image");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<MediaAsset | null>(null);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");

  const filters = React.useMemo(
    () => ({ q: search, kind, status, sort }),
    [search, kind, status, sort],
  );

  const list = useAdminList<MediaAsset>({ path: "/admin/media", filters });
  const statusCounts = useFacetCounts({
    path: "/admin/media",
    param: "status",
    filters: { q: search, kind },
    values: STATUS_VALUES,
  });

  async function remove() {
    if (!removing) return;
    setError("");
    setBusy(removing.id);
    try {
      await adminDeleteMedia(removing.id);
      setRemoving(null);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف رسانه");
    } finally {
      setBusy("");
    }
  }

  const chips: ListChip[] = [];
  if (status) {
    chips.push({
      key: "status",
      label: `وضعیت: ${STATUS_FA[status]?.label ?? status}`,
      count: statusCounts[status] ?? null,
      onRemove: () => setStatus(""),
    });
  }
  if (kind) {
    chips.push({
      key: "kind",
      label: `نوع: ${KIND_FA[kind] ?? kind}`,
      onRemove: () => setKind(""),
    });
  }

  return (
    <div className="space-y-4">
      <ListHeader title="رسانه‌ها" count={list.loading ? null : list.total} unit="فایل" />

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
          onUploaded={() => list.reload()}
        />
      </Card>

      <Card className="p-0">
        <ListToolbar
          search={{
            value: query,
            onChange: setQuery,
            onSubmit: () => setSearch(query.trim()),
            placeholder: "نام فایل",
          }}
          chips={chips}
          sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
          filters={
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">نوع</p>
                <Select aria-label="فیلتر نوع" value={kind} onChange={(e) => setKind(e.target.value)} className="w-full">
                  <option value="">همهٔ انواع</option>
                  {KIND_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {KIND_FA[value]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">وضعیت</p>
                <Select
                  aria-label="فیلتر وضعیت"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full"
                >
                  <option value="">همهٔ وضعیت‌ها</option>
                  {STATUS_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_FA[value].label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setKind("");
                  setStatus("");
                }}
              >
                پاک کردن فیلترها
              </Button>
            </div>
          }
        />

        <ListError error={list.error} />
        {list.loading ? (
          <ListLoading label="در حال بارگذاری رسانه‌ها" />
        ) : list.items.length === 0 ? (
          <EmptyState
            title="رسانه‌ای با این فیلترها نیست"
            body="فیلترها را تغییر دهید یا فایل تازه‌ای بارگذاری کنید."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">فایل</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">نوع</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">حجم</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">مدت</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">تاریخ</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((m) => {
                const meta = STATUS_FA[m.status] ?? { label: m.status, tone: "neutral" as const };
                const open = expanded === m.id;
                return (
                  <React.Fragment key={m.id}>
                    <TableRow>
                      <TableCell className="text-start whitespace-normal">
                        <div className="flex items-center gap-3">
                          <ListThumb src={m.url} alt={m.filename} />
                          <span className="truncate font-medium text-foreground" dir="ltr">
                            {m.filename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {KIND_FA[m.kind] ?? m.kind}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {faNumber(m.size_bytes)}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {m.duration_seconds ? `${fa(m.duration_seconds)} ثانیه` : "—"}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {formatJalali(new Date(m.created_at))}
                      </TableCell>
                      <TableCell className="text-start">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-start">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={open ? "بستن جزئیات" : "نمایش جزئیات"}
                            aria-expanded={open}
                            onClick={() => setExpanded(open ? null : m.id)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <RowMenu
                            label={`کنش‌های ${m.filename}`}
                            items={[
                              ...(m.url
                                ? [
                                    {
                                      label: "باز کردن فایل",
                                      icon: <ExternalLink />,
                                      href: m.url,
                                    },
                                  ]
                                : []),
                              {
                                label: "حذف فایل",
                                icon: <Trash2 />,
                                variant: "destructive" as const,
                                onSelect: () => setRemoving(m),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={7}>
                        <DetailGrid>
                          <DetailItem label="نام فایل" dir="ltr">
                            {m.filename}
                          </DetailItem>
                          <DetailItem label="نوع">{KIND_FA[m.kind] ?? m.kind}</DetailItem>
                          <DetailItem label="حجم">{faNumber(m.size_bytes)}</DetailItem>
                          <DetailItem label="شناسهٔ رسانه">
                            <span dir="ltr" className="text-xs">
                              {m.id}
                            </span>
                          </DetailItem>
                        </DetailGrid>
                        <DetailSection title="پیش‌نمایش">
                          <DetailCard title={m.filename} subtitle={m.mime}>
                            {m.kind === "image" && m.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.url}
                                alt={m.filename}
                                className="mt-2 max-h-56 w-full rounded-md object-cover"
                              />
                            ) : null}
                          </DetailCard>
                        </DetailSection>
                      </ListDetailRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}

        <ListPagination page={list.page} pages={list.pages} total={list.total} onPage={list.setPage} />
      </Card>

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف فایل</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.filename} از کتابخانهٔ رسانه حذف می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === removing?.id}
              onClick={() => void remove()}
            >
              حذف فایل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
