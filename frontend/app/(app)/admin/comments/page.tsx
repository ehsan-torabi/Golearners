"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  adminCommentAction,
  adminDeleteComment,
  adminListComments,
  type AdminComment,
} from "@/lib/admin";
import { fa } from "@/lib/utils";
import { formatJalali } from "@/lib/jalali";
import { ListHeader } from "@/components/admin/list-view";

const STATUS_TONE: Record<string, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  spam: "destructive",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار",
  approved: "تأییدشده",
  spam: "هرزنامه",
};

/**
 * Comment moderation queue — guests post freely, nothing shows until approved.
 */
export default function AdminCommentsPage() {
  const [tab, setTab] = React.useState("pending");
  const [rows, setRows] = React.useState<AdminComment[]>([]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [removing, setRemoving] = React.useState<AdminComment | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await adminListComments({ status: tab, per_page: 50 });
      setRows(res.data ?? []);
      setCounts(res.counts ?? {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت دیدگاه‌ها");
    } finally {
      setLoaded(true);
    }
  }, [tab]);

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

  const badge = (status: string) =>
    counts[status] ? <span className="ms-1 text-[10px]">{fa(counts[status])}</span> : null;

  return (
    <div className="space-y-4">
      <ListHeader
        title="دیدگاه‌ها"
        count={(counts.pending ?? 0) + (counts.approved ?? 0) + (counts.spam ?? 0)}
        unit="دیدگاه"
        subtitle="دیدگاه‌های مهمان پس از تأیید شما منتشر می‌شوند."
      />

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <div className="border-b border-border-variant px-5">
            <TabsList variant="line" className="h-11 w-full justify-start gap-5 p-0">
              <TabsTrigger value="pending">
                در انتظار{badge("pending")}
              </TabsTrigger>
              <TabsTrigger value="approved">
                تأییدشده{badge("approved")}
              </TabsTrigger>
              <TabsTrigger value="spam">
                هرزنامه{badge("spam")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={tab}>
            {!loaded ? (
              <div className="space-y-3 p-6" aria-label="در حال بارگذاری دیدگاه‌ها">
                <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                title={tab === "pending" ? "صف تأیید خالی است" : "موردی یافت نشد"}
                body="دیدگاه‌های تازهٔ مهمان اینجا منتظر تأیید می‌مانند."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">نویسنده</TableHead>
                    <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">دیدگاه</TableHead>
                    <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">نوشته</TableHead>
                    <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">تاریخ</TableHead>
                    <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                    <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">کنش‌ها</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-start align-top">
                        <div className="font-medium text-foreground">{row.author_name}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {row.author_email}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-80 text-start align-top text-sm text-foreground">
                        <p className="whitespace-pre-line line-clamp-4">{row.body}</p>
                        {row.parent_id && (
                          <span className="mt-1 inline-block text-[11px] text-muted-foreground">↩ پاسخ</span>
                        )}
                      </TableCell>
                      <TableCell className="text-start align-top text-xs">
                        <Link
                          href={`/blog/${row.post_slug}`}
                          className="line-clamp-2 text-muted-foreground hover:text-foreground"
                          target="_blank"
                        >
                          {row.post_title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-start align-top text-xs text-muted-foreground" dir="ltr">
                        {formatJalali(new Date(row.created_at))}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap items-center gap-1">
                          {row.status === "pending" && (
                            <Button
                              size="sm"
                              loading={busy === `approve-${row.id}`}
                              onClick={() =>
                                void run(`approve-${row.id}`, () => adminCommentAction(row.id, "approve"))
                              }
                            >
                              تأیید
                            </Button>
                          )}
                          {row.status === "approved" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={busy === `unapprove-${row.id}`}
                              onClick={() =>
                                void run(`unapprove-${row.id}`, () => adminCommentAction(row.id, "unapprove"))
                              }
                            >
                              به صف
                            </Button>
                          )}
                          {row.status !== "spam" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={busy === `spam-${row.id}`}
                              onClick={() =>
                                void run(`spam-${row.id}`, () => adminCommentAction(row.id, "spam"))
                              }
                            >
                              هرزنامه
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive-text"
                            onClick={() => setRemoving(row)}
                          >
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
            <AlertDialogTitle>حذف دیدگاه</AlertDialogTitle>
            <AlertDialogDescription>
              دیدگاه «{removing?.author_name}» برای همیشه حذف می‌شود.
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
                  await adminDeleteComment(removing.id);
                  setRemoving(null);
                })
              }
            >
              حذف دیدگاه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
