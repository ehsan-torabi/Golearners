"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  DetailCard,
  DetailGrid,
  DetailItem,
  DetailSection,
  ListDetailRow,
  ListHeader,
  ListLoading,
  ListPagination,
  ListToolbar,
  useAdminList,
} from "@/components/admin/list-view";
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

const ENTITY_FA: Record<string, string> = {
  user: "کاربر",
  course: "دوره",
  post: "نوشته",
  order: "سفارش",
  coupon: "کد تخفیف",
  settings: "تنظیمات",
  media: "رسانه",
  category: "دسته‌بندی",
};

export default function AdminAuditLogsPage() {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const list = useAdminList<AuditRow>({ path: "/admin/audit-logs" });

  return (
    <div className="space-y-4">
      <ListHeader title="گزارش رویدادها" count={list.loading ? null : list.total} unit="رویداد" />

      {list.error && <Alert>{list.error}</Alert>}

      <Card className="p-0">
        <ListToolbar
          chips={[]}
          filters={
            <p className="text-xs leading-6 text-muted-foreground">
              هر تغییر حساس در پنل مدیریت اینجا ثبت می‌شود. روی هر ردیف کلیک کنید تا شناسهٔ کامل موجودیت را
              ببینید.
            </p>
          }
        />

        {list.loading ? (
          <ListLoading label="در حال بارگذاری گزارش رویدادها" />
        ) : list.items.length === 0 ? (
          <EmptyState
            title="رویدادی ثبت نشده است"
            body="با انجام عملیات مدیریتی، رویدادها اینجا فهرست می‌شوند."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">رویداد</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">موجودیت</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">عامل</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">IP</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">زمان</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((r) => {
                const open = expanded === r.ID;
                return (
                  <React.Fragment key={r.ID}>
                    <TableRow>
                      <TableCell className="text-start">
                        <Badge tone="accent">{r.Action}</Badge>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {ENTITY_FA[r.EntityType] ?? r.EntityType}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground" dir="ltr">
                        {r.ActorID ? `${r.ActorID.slice(0, 8)}…` : "سیستم"}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground" dir="ltr">
                        {r.IP || "ثبت نشده"}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {formatJalali(new Date(r.CreatedAt))}
                      </TableCell>
                      <TableCell className="text-start">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={open ? "بستن جزئیات" : "نمایش جزئیات"}
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : r.ID)}
                        >
                          {open ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={6}>
                        <DetailGrid>
                          <DetailItem label="رویداد">{r.Action}</DetailItem>
                          <DetailItem label="نوع موجودیت">
                            {ENTITY_FA[r.EntityType] ?? r.EntityType}
                          </DetailItem>
                          <DetailItem label="شناسهٔ موجودیت">
                            <span dir="ltr" className="text-xs">
                              {r.EntityID}
                            </span>
                          </DetailItem>
                          <DetailItem label="شناسهٔ رویداد">
                            <span dir="ltr" className="text-xs">
                              {r.ID}
                            </span>
                          </DetailItem>
                          <DetailItem label="IP" dir="ltr">
                            {r.IP || "ثبت نشده"}
                          </DetailItem>
                          <DetailItem label="زمان">{formatJalali(new Date(r.CreatedAt))}</DetailItem>
                        </DetailGrid>
                        <DetailSection title="عامل">
                          <DetailCard
                            title={r.ActorID ? `کاربر ${r.ActorID.slice(0, 8)}…` : "سامانه"}
                            subtitle={r.Action}
                          />
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
    </div>
  );
}
