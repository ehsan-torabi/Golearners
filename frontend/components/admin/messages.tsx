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
import { ApiError, api } from "@/lib/api";
import { fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";

/* message-list block, wired to the real contact messages endpoint. */
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
  open: { label: "باز", tone: "warning" },
  replied: { label: "پاسخ‌داده‌شده", tone: "success" },
  closed: { label: "بسته", tone: "neutral" },
};

export function AdminMessages() {
  const [messages, setMessages] = React.useState<MessageRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const res = await fetchAdmin<{ data: MessageRow[] }>("/admin/messages");
      setMessages(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت پیام‌ها");
    } finally {
      setLoaded(true);
    }
  }, []);

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

  if (messages.length === 0) {
    return (
      <EmptyState
        title="پیامی ثبت نشده است"
        body="پیام‌های فرم تماس مشتری‌ها همین‌جا فهرست می‌شوند."
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
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
  );
}
