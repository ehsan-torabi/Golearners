"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { adminSetUserStatus, fetchAdmin } from "@/lib/admin";
import { fa, formatIranMobile } from "@/lib/persian";

const STATUS_FA: Record<string, string> = { active: "فعال", blocked: "مسدود" };

interface UserRow {
  id: string;
  mobile: string;
  full_name: string;
  status: string;
  roles: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(async (query: string) => {
    try {
      const res = await fetchAdmin<{ data: UserRow[] }>(`/users?per_page=50&q=${encodeURIComponent(query)}`);
      setUsers(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت کاربران");
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load("");
  }, [load]);

  async function toggleBlock(u: UserRow) {
    setError("");
    try {
      await adminSetUserStatus(u.id, u.status === "active" ? "blocked" : "active");
      await load(q);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت ناموفق بود");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">کاربران</h1>
        <form
          className="flex gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            void load(q);
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی نام یا شماره"
            className="w-56"
            aria-label="جست‌وجوی کاربر"
          />
          <Button size="md" variant="outline" type="submit">
            جست‌وجو
          </Button>
        </form>
      </div>
      {error && <Alert>{error}</Alert>}
      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری کاربران">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {users.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">کاربری با این عبارت پیدا نشد.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{u.full_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                    {formatIranMobile(u.mobile)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {u.roles.map((role) => (
                    <Badge key={role} tone="accent">
                      {role}
                    </Badge>
                  ))}
                  <Badge tone={u.status === "active" ? "success" : "destructive"}>
                    {STATUS_FA[u.status] ?? u.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant={u.status === "active" ? "destructive" : "primary"}
                    onClick={() => toggleBlock(u)}
                  >
                    {u.status === "active" ? "مسدودسازی" : "رفع مسدودی"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>
      )}
      {loaded && users.length > 0 && (
        <p className="text-xs text-muted-foreground">تعداد نمایش‌داده‌شده: {fa(users.length)}</p>
      )}
    </div>
  );
}
