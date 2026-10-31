"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
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
  const [q, setQ] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(async (query: string) => {
    try {
      const res = await fetchAdmin<{ data: UserRow[] }>(`/users?per_page=50&q=${encodeURIComponent(query)}`);
      setUsers(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت کاربران");
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
          onSubmit={(e) => {
            e.preventDefault();
            void load(q);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی نام یا شماره…"
            className="h-10 w-56 rounded-field border-line bg-field px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            aria-label="جستجوی کاربر"
          />
          <Button size="sm" variant="secondary" type="submit">
            جستجو
          </Button>
        </form>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Card className="divide-y divide-border">
        {users.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">کاربری یافت نشد.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium">{u.full_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                  {formatIranMobile(u.mobile)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {u.roles.map((role) => (
                  <Badge key={role} className="border-primary/40 text-primary">
                    {role}
                  </Badge>
                ))}
                <Badge
                  className={
                    u.status === "active" ? "border-success/40 text-success" : "border-destructive/40 text-destructive"
                  }
                >
                  {STATUS_FA[u.status] ?? u.status}
                </Badge>
                <Button size="sm" variant={u.status === "active" ? "secondary" : "primary"} onClick={() => toggleBlock(u)}>
                  {u.status === "active" ? "مسدودسازی" : "رفع مسدودی"}
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
      <p className="text-xs text-muted-foreground">تعداد نمایش‌داده‌شده: {fa(users.length)}</p>
    </div>
  );
}
