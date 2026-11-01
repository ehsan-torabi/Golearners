"use client";

import * as React from "react";
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
import { fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { faNumber } from "@/lib/utils";

interface MediaRow {
  id: string;
  kind: string;
  mime: string;
  status: string;
  size_bytes: number;
  storage_key: string;
  created_at: string;
  error_message: string | null;
}

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" | "neutral" }> = {
  ready: { label: "آماده", tone: "success" },
  processing: { label: "در حال پردازش", tone: "warning" },
  failed: { label: "ناموفق", tone: "destructive" },
  pending: { label: "در انتظار", tone: "neutral" },
};

export default function AdminMediaPage() {
  const [media, setMedia] = React.useState<MediaRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const res = await fetchAdmin<{ data: MediaRow[] }>("/admin/media?per_page=50");
      setMedia(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت رسانه‌ها");
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="reveal text-xl leading-7 text-foreground">رسانه‌ها</h1>
      {error && <Alert>{error}</Alert>}
      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری رسانه‌ها">
          <div className="h-5 w-1/3 animate-pulse rounded bg-accent" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-accent" />
        </Card>
      ) : media.length === 0 ? (
        <EmptyState title="رسانه‌ای ثبت نشده است" body="ویدیوهای درس‌ها به‌صورت خودکار اینجا ثبت می‌شوند." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">رسانه</TableHead>
                  <TableHead className="text-start">نوع</TableHead>
                  <TableHead className="text-start">حجم</TableHead>
                  <TableHead className="text-start">وضعیت</TableHead>
                  <TableHead className="text-start">تاریخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((m) => {
                  const status = STATUS_FA[m.status] ?? { label: m.status, tone: "neutral" as const };
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-start">
                        <p className="font-medium text-foreground" dir="ltr">
                          {m.storage_key.split("/").slice(-2).join("/")}
                        </p>
                        {m.error_message && (
                          <p className="mt-0.5 text-xs text-destructive-text">{m.error_message}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground" dir="ltr">
                        {m.mime}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {faNumber(Math.round(m.size_bytes / 1024))} کیلوبایت
                      </TableCell>
                      <TableCell className="text-start">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {formatJalali(new Date(m.created_at))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </table>
        </Card>
      )}
    </div>
  );
}
