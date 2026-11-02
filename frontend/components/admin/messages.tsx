"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, api } from "@/lib/api";
import { fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

/* message-list block, wired to the real contact messages endpoint. */
interface MessageRow {
  ID: string;
  Name: string;
  Contact: string;
  Body: string;
  Status: string;
  CreatedAt: string;
}

const FILTERS = [
  { value: "", label: "همه" },
  { value: "new", label: "خوانده‌نشده" },
  { value: "read", label: "خوانده‌شده" },
  { value: "replied", label: "پاسخ‌داده‌شده" },
  { value: "closed", label: "بسته" },
];

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  new: { label: "خوانده‌نشده", tone: "warning" },
  read: { label: "خوانده‌شده", tone: "neutral" },
  replied: { label: "پاسخ‌داده‌شده", tone: "success" },
  closed: { label: "بسته", tone: "neutral" },
};

export function AdminMessages() {
  const [messages, setMessages] = React.useState<MessageRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (filter) params.set("status", filter);
      const res = await fetchAdmin<{ data: MessageRow[]; meta: { total: number } }>(
        `/admin/messages?${params}`,
      );
      setMessages(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت پیام‌ها");
    } finally {
      setLoaded(true);
    }
  }, [page, filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    setError("");
    setBusy(id);
    try {
      await api(`/admin/messages/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setBusy("");
    }
  }

  if (!loaded) {
    return (
      <Card className="space-y-3 p-6" aria-label="در حال بارگذاری پیام‌ها">
        <div className="h-5 w-1/3 animate-pulse rounded bg-accent" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-accent" />
      </Card>
    );
  }

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={filter}
          onValueChange={(v) => {
            setFilter(v);
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
        <span className="ms-auto text-sm text-muted-foreground">{fa(total)} پیام</span>
      </div>

      {messages.length === 0 ? (
        <EmptyState
          title="پیامی با این فیلترها نیست"
          body="فیلتر وضعیت را تغییر دهید یا منتظر پیام تازه باشید."
        />
      ) : (
        <div className="space-y-4">
      {messages.map((m) => {
        const status = STATUS_FA[m.Status] ?? { label: m.Status, tone: "neutral" as const };
        return (
          <Card key={m.ID}>
            <CardHeader className="flex-row items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback>{m.Name?.slice(0, 1) ?? "؟"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate">{m.Name || "بدون نام"}</CardTitle>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {m.Contact}
                </p>
              </div>
              <Badge tone={status.tone}>{status.label}</Badge>
            </CardHeader>
            <CardContent>
              <Separator className="mb-3" />
              <p className="text-sm leading-7 text-foreground">{m.Body}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatJalali(new Date(m.CreatedAt))}
                </span>
                <div className="flex gap-2">
                  {m.Status !== "closed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busy === m.ID}
                      onClick={() => setStatus(m.ID, "closed")}
                    >
                      بستن
                    </Button>
                  )}
                  {m.Status !== "replied" && (
                    <Button
                      size="sm"
                      loading={busy === m.ID}
                      onClick={() => setStatus(m.ID, "replied")}
                    >
                      پاسخ داده شد
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
        </div>
      )}

      {total > 0 && (
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
