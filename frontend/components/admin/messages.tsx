"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp, Mail, MailOpen } from "lucide-react";
import { Alert } from "@/components/ui/alert";
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
  ListToolbar,
  RowMenu,
  useAdminList,
  useFacetCounts,
  type ListChip,
  ListError,
} from "@/components/admin/list-view";
import { ApiError, api } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

interface MessageRow {
  ID: string;
  Name: string;
  Contact: string;
  Body: string;
  Status: string;
  CreatedAt: string;
}

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  new: { label: "خوانده‌نشده", tone: "warning" },
  read: { label: "خوانده‌شده", tone: "neutral" },
  replied: { label: "پاسخ‌داده‌شده", tone: "success" },
  closed: { label: "بسته", tone: "neutral" },
};

const STATUS_VALUES = ["new", "read", "replied", "closed"];

export function AdminMessages() {
  const [status, setStatus] = React.useState("");
  const [allStatuses, setAllStatuses] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");

  const list = useAdminList<MessageRow>({
    path: "/admin/messages",
    filters: { status: allStatuses ? "" : status },
  });
  const statusCounts = useFacetCounts({
    path: "/admin/messages",
    param: "status",
    values: STATUS_VALUES,
  });

  async function setMessageStatus(id: string, next: string) {
    setError("");
    setBusy(id);
    try {
      await api(`/admin/messages/${id}/status`, { method: "POST", body: JSON.stringify({ status: next }) });
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت پیام ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  const chips: ListChip[] = [];
  if (!allStatuses) {
    chips.push({
      key: "status",
      label: `وضعیت: ${STATUS_FA[status]?.label ?? status}`,
      count: statusCounts[status] ?? null,
      onRemove: () => setStatus(""),
    });
  }

  return (
    <div className="space-y-4">
      <ListHeader title="پیام‌های تماس" count={list.loading ? null : list.total} unit="پیام" />

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <ListToolbar
          chips={chips}
          toggle={{ checked: allStatuses, onChange: setAllStatuses, label: "نمایش همهٔ وضعیت‌ها" }}
          filters={
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">وضعیت</p>
                <Select
                  aria-label="فیلتر وضعیت"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full"
                  disabled={allStatuses}
                >
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
                  setStatus("new");
                  setAllStatuses(false);
                }}
              >
                فقط پیام‌های تازه
              </Button>
            </div>
          }
        />

        <ListError error={list.error} />
        {list.loading ? (
          <ListLoading label="در حال بارگذاری پیام‌ها" />
        ) : list.items.length === 0 ? (
          <EmptyState title="پیامی نیست" body="پیام‌های فرستاده‌شده از فرم تماس اینجا می‌نشینند." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">فرستنده</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">راه ارتباطی</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">پیام</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">تاریخ</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((m) => {
                const meta = STATUS_FA[m.Status] ?? { label: m.Status, tone: "neutral" as const };
                const open = expanded === m.ID;
                return (
                  <React.Fragment key={m.ID}>
                    <TableRow>
                      <TableCell className="text-start whitespace-normal">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-tint text-xs font-semibold text-accent-strong">
                            {(m.Name || "؟").trim().slice(0, 1)}
                          </span>
                          <span className="truncate font-medium text-foreground">{m.Name || "ناشناس"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground" dir="ltr">
                        {m.Contact || "—"}
                      </TableCell>
                      <TableCell className="text-start whitespace-normal">
                        <span className="block max-w-80 truncate text-muted-foreground">{m.Body}</span>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {formatJalali(new Date(m.CreatedAt))}
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
                            onClick={() => setExpanded(open ? null : m.ID)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <RowMenu
                            label={`کنش‌های پیام ${m.Name}`}
                            items={[
                              {
                                label: "خوانده‌شده",
                                icon: <MailOpen />,
                                disabled: m.Status === "read" || busy === m.ID,
                                onSelect: () => void setMessageStatus(m.ID, "read"),
                              },
                              {
                                label: "پاسخ‌داده‌شده",
                                icon: <Mail />,
                                disabled: m.Status === "replied" || busy === m.ID,
                                onSelect: () => void setMessageStatus(m.ID, "replied"),
                              },
                              {
                                label: "بستن پیام",
                                icon: <Check />,
                                disabled: m.Status === "closed" || busy === m.ID,
                                onSelect: () => void setMessageStatus(m.ID, "closed"),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={6}>
                        <DetailGrid>
                          <DetailItem label="نام">{m.Name || "—"}</DetailItem>
                          <DetailItem label="راه ارتباطی" dir="ltr">
                            {m.Contact || "—"}
                          </DetailItem>
                          <DetailItem label="تاریخ">{formatJalali(new Date(m.CreatedAt))}</DetailItem>
                          <DetailItem label="وضعیت">{meta.label}</DetailItem>
                        </DetailGrid>
                        <DetailSection title="متن پیام">
                          <DetailCard title={m.Name || "پیام"} subtitle={m.Contact}>
                            <p className="mt-2 text-sm leading-7 text-foreground">{m.Body}</p>
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
    </div>
  );
}
