"use client";

import * as React from "react";
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
import { fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

interface AuditRow {
  ID: string;
  ActorID: string | null;
  Action: string;
  EntityType: string;
  EntityID: string;
  IP: string;
  CreatedAt: string;
}

const PER_PAGE = 20;

export default function AdminAuditLogsPage() {
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const res = await fetchAdmin<{ data: AuditRow[]; meta: { total: number } }>(
        `/admin/audit-logs?page=${page}&per_page=${PER_PAGE}`,
      );
      setRows(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت گزارش رویدادها");
    } finally {
      setLoaded(true);
    }
  }, [page]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="reveal text-xl leading-7 text-foreground">گزارش رویدادها</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          هر تغییر حساس در پنل مدیریت اینجا ثبت می‌شود. مجموع {fa(total)} رویداد.
        </p>
      </div>
      {error && <Alert>{error}</Alert>}
      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری گزارش رویدادها">
          <div className="h-5 w-1/3 animate-pulse rounded bg-accent" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-accent" />
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState title="رویدادی ثبت نشده است" body="با انجام عملیات مدیریتی، رویدادها اینجا فهرست می‌شوند." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">رویداد</TableHead>
                  <TableHead className="text-start">موجودیت</TableHead>
                  <TableHead className="text-start">IP</TableHead>
                  <TableHead className="text-start">زمان</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.ID}>
                    <TableCell className="text-start">
                      <Badge tone="accent">{r.Action}</Badge>
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground" dir="ltr">
                      {r.EntityType} {r.EntityID.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground" dir="ltr">
                      {r.IP || "—"}
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {formatJalali(new Date(r.CreatedAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </table>
        </Card>
      )}

      {loaded && total > 0 && (
        <div className="flex items-center justify-between gap-3 text-sm">
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
    </div>
  );
}
