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
const ROLE_FA: Record<string, string> = { learner: "دانشجو", admin: "مدیر", instructor: "مدرس" };

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
  const [busy, setBusy] = React.useState("");

  const load = React.useCallback(async (query: string) => {
    try {
      const res = await fetchAdmin<{ data: UserRow[] }>(`/admin/users?per_page=50&q=${encodeURIComponent(query)}`);
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
    setBusy(u.id);
    try {
      await adminSetUserStatus(u.id, u.status === "active" ? "blocked" : "active");
      await load(q);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="reveal text-xl leading-7 text-foreground">کاربران</h1>
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
          <Button variant="outline" type="submit">
            جست‌وجو
          </Button>
        </form>
      </div>
      {error && <Alert>{error}</Alert>}
      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری کاربران">
          <div className="h-5 w-1/3 animate-pulse rounded bg-accent" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-accent" />
        </Card>
      ) : users.length === 0 ? (
        <EmptyState title="کاربری با این عبارت پیدا نشد" body="عبارت جست‌وجو را ساده‌تر کن." />
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-border-variant px-5 py-3 text-xs text-muted-foreground">
            تعداد نمایش‌داده‌شده: {fa(users.length)}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 text-start font-medium">کاربر</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">شماره</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">نقش</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">وضعیت</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-variant">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted">
                  <td className="px-5 py-3 font-medium text-foreground">{u.full_name}</td>
                  <td className="px-5 py-3 text-muted-foreground" dir="ltr">
                    {formatIranMobile(u.mobile)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <Badge key={role} tone="accent">
                          {ROLE_FA[role] ?? role}
                        </Badge>
                      ))}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={u.status === "active" ? "success" : "destructive"}>
                      {STATUS_FA[u.status] ?? u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Button
                      size="sm"
                      variant={u.status === "active" ? "destructive" : "default"}
                      loading={busy === u.id}
                      onClick={() => toggleBlock(u)}
                    >
                      {u.status === "active" ? "مسدودسازی" : "رفع مسدودی"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
