"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, api } from "@/lib/api";
import { adminSetUserStatus, fetchAdmin } from "@/lib/admin";
import { fa, formatIranMobile } from "@/lib/persian";

const STATUS_FA: Record<string, string> = { active: "فعال", blocked: "مسدود" };
const ROLE_FA: Record<string, string> = { learner: "دانشجو", admin: "مدیر", instructor: "مدرس" };
const GRANTABLE = ["learner", "admin", "instructor"];
const PER_PAGE = 20;

interface UserRow {
  id: string;
  mobile: string;
  full_name: string;
  email: string | null;
  status: string;
  roles: string[];
  created_at: string;
  last_login_at: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loaded, setLoaded] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [isOwner, setIsOwner] = React.useState(false);
  const [roleDraft, setRoleDraft] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
      if (search) params.set("q", search);
      const res = await fetchAdmin<{ data: UserRow[]; meta: { total: number } }>(
        `/admin/users?${params}`,
      );
      setUsers(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت کاربران");
    } finally {
      setLoaded(true);
    }
  }, [page, search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    api<{ roles?: string[] }>("/me")
      .then((me) => setIsOwner((me.roles ?? []).includes("owner")))
      .catch(() => setIsOwner(false));
  }, []);

  async function toggleBlock(u: UserRow) {
    setError("");
    setBusy(u.id);
    try {
      await adminSetUserStatus(u.id, u.status === "active" ? "blocked" : "active");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  async function changeRole(u: UserRow, mode: "add" | "remove", role: string) {
    if (!role) return;
    setError("");
    setBusy(u.id);
    try {
      await api(`/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify(mode === "add" ? { add_role: role } : { remove_role: role }),
      });
      setRoleDraft((d) => ({ ...d, [u.id]: "" }));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر نقش ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reveal text-xl leading-7 text-foreground">کاربران</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loaded ? `${fa(total)} کاربر ثبت شده است.` : "در حال شمارش کاربران…"}
          </p>
        </div>
        <form
          className="flex items-end gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
            setPage(1);
          }}
        >
          <div>
            <label htmlFor="user-q" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              جست‌وجو
            </label>
            <Input
              id="user-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="نام یا شمارهٔ موبایل"
              className="w-56"
            />
          </div>
          <Button variant="outline" type="submit">
            جست‌وجو
          </Button>
        </form>
      </header>

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        {!loaded ? (
          <div className="space-y-3 p-6" aria-label="در حال بارگذاری کاربران">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="کاربری با این عبارت پیدا نشد" body="عبارت جست‌وجو را ساده‌تر کنید." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">کاربر</TableHead>
                <TableHead className="text-start">شماره</TableHead>
                <TableHead className="text-start">نقش‌ها</TableHead>
                <TableHead className="text-start">وضعیت</TableHead>
                <TableHead className="text-start">کنش‌ها</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-start">
                    <span className="font-medium text-foreground">{u.full_name || "—"}</span>
                    {u.email && (
                      <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                        {u.email}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-start text-muted-foreground" dir="ltr">
                    {formatIranMobile(u.mobile)}
                  </TableCell>
                  <TableCell className="text-start">
                    <span className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <Badge key={role} tone="accent">
                          {ROLE_FA[role] ?? role}
                        </Badge>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-start">
                    <Badge tone={u.status === "active" ? "success" : "destructive"}>
                      {STATUS_FA[u.status] ?? u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-start">
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        size="sm"
                        variant={u.status === "active" ? "destructive" : "default"}
                        loading={busy === u.id}
                        onClick={() => void toggleBlock(u)}
                      >
                        {u.status === "active" ? "مسدودسازی" : "رفع مسدودی"}
                      </Button>
                      {isOwner && (
                        <div className="flex flex-wrap items-center gap-1">
                          <Select
                            aria-label={`افزودن نقش به ${u.full_name || u.mobile}`}
                            value={roleDraft[u.id] ?? ""}
                            className="w-28"
                            onChange={(e) => setRoleDraft((d) => ({ ...d, [u.id]: e.target.value }))}
                          >
                            <option value="">نقش…</option>
                            {GRANTABLE.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_FA[r]}
                              </option>
                            ))}
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!roleDraft[u.id]}
                            onClick={() => void changeRole(u, "add", roleDraft[u.id] ?? "")}
                          >
                            افزودن
                          </Button>
                          {u.roles
                            .filter((r) => r !== "owner")
                            .map((r) => (
                              <Button
                                key={r}
                                size="sm"
                                variant="ghost"
                                className="text-destructive-text"
                                loading={busy === u.id}
                                onClick={() => void changeRole(u, "remove", r)}
                              >
                                حذف {ROLE_FA[r] ?? r}
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {loaded && total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border-variant px-4 py-3 text-sm">
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
      </Card>
    </div>
  );
}
