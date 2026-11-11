"use client";

import * as React from "react";
import { Ban, ChevronDown, ChevronUp, Pencil, ShieldCheck, UserCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DetailGrid,
  DetailItem,
  DetailSection,
  ListCheckbox,
  ListDetailRow,
  ListHeader,
  ListLoading,
  ListPagination,
  ListSelectionBar,
  ListToolbar,
  RowMenu,
  useAdminList,
  useFacetCounts,
  type ListChip,
  ListError,
} from "@/components/admin/list-view";
import { ApiError, api } from "@/lib/api";
import { adminSetUserStatus } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa, formatIranMobile } from "@/lib/persian";

const STATUS_FA: Record<string, { label: string; tone: "success" | "destructive" }> = {
  active: { label: "فعال", tone: "success" },
  blocked: { label: "مسدود", tone: "destructive" },
};

const STATUS_VALUES = ["active", "blocked"];

const ROLE_FA: Record<string, string> = {
  learner: "دانشجو",
  admin: "مدیر",
  instructor: "مدرس",
  owner: "مالک",
};

const GRANTABLE = ["learner", "admin", "instructor"];

const SORT_OPTIONS = [
  { value: "newest", label: "تازه‌ترین" },
  { value: "oldest", label: "قدیمی‌ترین" },
  { value: "name", label: "نام" },
  { value: "mobile", label: "شمارهٔ موبایل" },
  { value: "login", label: "آخرین ورود" },
];

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
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [roleDraft, setRoleDraft] = React.useState<Record<string, string>>({});
  const [draft, setDraft] = React.useState<Record<string, { full_name: string; email: string }>>({});
  const [isOwner, setIsOwner] = React.useState(false);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");

  const filters = React.useMemo(() => ({ q: search, status, sort }), [search, status, sort]);

  const list = useAdminList<UserRow>({ path: "/admin/users", filters });
  const statusCounts = useFacetCounts({
    path: "/admin/users",
    param: "status",
    filters: { q: search },
    values: STATUS_VALUES,
  });

  React.useEffect(() => {
    api<{ roles?: string[] }>("/me")
      .then((me) => setIsOwner((me.roles ?? []).includes("owner")))
      .catch(() => setIsOwner(false));
  }, []);

  async function setUserStatus(user: UserRow, next: "active" | "blocked") {
    setError("");
    setBusy(user.id);
    try {
      await adminSetUserStatus(user.id, next);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  async function bulkStatus(next: "active" | "blocked") {
    setError("");
    setBusy("bulk");
    try {
      for (const id of selected) {
        await adminSetUserStatus(id, next);
      }
      setSelected([]);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت گروهی ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  /** Opens the expanded row and seeds the editable profile fields. */
  function startEdit(user: UserRow) {
    setDraft((d) => ({
      ...d,
      [user.id]: { full_name: user.full_name, email: user.email ?? "" },
    }));
    setExpanded(user.id);
  }

  async function saveProfile(user: UserRow) {
    const values = draft[user.id];
    if (!values) return;
    setError("");
    setBusy(user.id);
    try {
      await api(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          full_name: values.full_name,
          email: values.email,
        }),
      });
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیرهٔ اطلاعات کاربر ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  async function changeRole(user: UserRow, mode: "add" | "remove", role: string) {
    if (!role) return;
    setError("");
    setBusy(user.id);
    try {
      await api(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(mode === "add" ? { add_role: role } : { remove_role: role }),
      });
      setRoleDraft((d) => ({ ...d, [user.id]: "" }));
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر نقش ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  const toggleSelected = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const allSelected = list.items.length > 0 && list.items.every((u) => selected.includes(u.id));

  const chips: ListChip[] = [];
  if (status) {
    chips.push({
      key: "status",
      label: `وضعیت: ${STATUS_FA[status]?.label ?? status}`,
      count: statusCounts[status] ?? null,
      onRemove: () => setStatus(""),
    });
  }

  return (
    <div className="space-y-4">
      <ListHeader title="کاربران" count={list.loading ? null : list.total} unit="کاربر" />

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        {selected.length > 0 ? (
          <ListSelectionBar count={selected.length} onClear={() => setSelected([])}>
            <Button size="sm" variant="outline" loading={busy === "bulk"} onClick={() => void bulkStatus("active")}>
              فعال‌سازی
            </Button>
            <Button size="sm" variant="outline" loading={busy === "bulk"} onClick={() => void bulkStatus("blocked")}>
              مسدودسازی
            </Button>
          </ListSelectionBar>
        ) : (
          <ListToolbar
            search={{
              value: query,
              onChange: setQuery,
              onSubmit: () => setSearch(query.trim()),
              placeholder: "نام یا شمارهٔ موبایل",
            }}
            chips={chips}
            sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
            filters={
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">وضعیت</p>
                  <Select aria-label="فیلتر وضعیت" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
                    <option value="">همهٔ کاربران</option>
                    {STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_FA[value].label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button size="sm" variant="ghost" className="w-full" onClick={() => setStatus("")}>
                  پاک کردن فیلترها
                </Button>
              </div>
            }
          />
        )}

        <ListError error={list.error} />
        {list.loading ? (
          <ListLoading label="در حال بارگذاری کاربران" />
        ) : list.items.length === 0 ? (
          <EmptyState title="کاربری با این فیلترها نیست" body="عبارت جست‌وجو یا فیلتر وضعیت را تغییر دهید." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <ListCheckbox
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={(checked) => setSelected(checked ? list.items.map((u) => u.id) : [])}
                    label="انتخاب همهٔ کاربران"
                  />
                </TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">کاربر</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">موبایل</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">ایمیل</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">نقش‌ها</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">عضویت</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((u) => {
                const meta = STATUS_FA[u.status] ?? { label: u.status, tone: "neutral" as const };
                const open = expanded === u.id;
                return (
                  <React.Fragment key={u.id}>
                    <TableRow data-state={selected.includes(u.id) ? "selected" : undefined}>
                      <TableCell className="w-10">
                        <ListCheckbox
                          checked={selected.includes(u.id)}
                          onChange={() => toggleSelected(u.id)}
                          label={`انتخاب ${u.full_name || u.mobile}`}
                        />
                      </TableCell>
                      <TableCell className="text-start whitespace-normal">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-tint text-xs font-semibold text-accent-strong">
                            {(u.full_name || u.mobile).trim().slice(0, 1)}
                          </span>
                          <span className="truncate font-medium text-foreground">
                            {u.full_name || "کاربر بدون نام"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground" dir="ltr">
                        {formatIranMobile(u.mobile)}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground" dir="ltr">
                        {u.email || "—"}
                      </TableCell>
                      <TableCell className="text-start">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            u.roles.map((role) => (
                              <Badge key={role} tone="accent">
                                {ROLE_FA[role] ?? role}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {formatJalali(new Date(u.created_at))}
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
                            onClick={() => (open ? setExpanded(null) : startEdit(u))}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <RowMenu
                            label={`کنش‌های ${u.full_name || u.mobile}`}
                            items={[
                              {
                                label: "ویرایش اطلاعات",
                                icon: <Pencil />,
                                onSelect: () => startEdit(u),
                              },
                              {
                                label: "تغییر نقش‌ها",
                                icon: <ShieldCheck />,
                                onSelect: () => startEdit(u),
                                disabled: !isOwner,
                              },
                              {
                                label: u.status === "active" ? "مسدودسازی" : "رفع مسدودی",
                                icon: u.status === "active" ? <Ban /> : <UserCheck />,
                                onSelect: () =>
                                  void setUserStatus(u, u.status === "active" ? "blocked" : "active"),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={8}>
                        <div className="space-y-4">
                          <div>
                            <p className="mb-2 text-sm font-semibold text-foreground">اطلاعات پروفایل</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="نام و نام خانوادگی" htmlFor={`user-name-${u.id}`}>
                                <Input
                                  id={`user-name-${u.id}`}
                                  value={draft[u.id]?.full_name ?? u.full_name}
                                  onChange={(e) =>
                                    setDraft((d) => ({
                                      ...d,
                                      [u.id]: {
                                        full_name: e.target.value,
                                        email: d[u.id]?.email ?? u.email ?? "",
                                      },
                                    }))
                                  }
                                />
                              </Field>
                              <Field label="ایمیل" htmlFor={`user-email-${u.id}`}>
                                <Input
                                  id={`user-email-${u.id}`}
                                  type="email"
                                  dir="ltr"
                                  value={draft[u.id]?.email ?? u.email ?? ""}
                                  onChange={(e) =>
                                    setDraft((d) => ({
                                      ...d,
                                      [u.id]: {
                                        full_name: d[u.id]?.full_name ?? u.full_name,
                                        email: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </Field>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <Button
                                size="sm"
                                loading={busy === u.id}
                                onClick={() => void saveProfile(u)}
                              >
                                ذخیرهٔ تغییرات
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                شمارهٔ موبایل قابل ویرایش نیست.
                              </span>
                            </div>
                          </div>
                          <DetailGrid>
                          <DetailItem label="شمارهٔ موبایل" dir="ltr">
                            {formatIranMobile(u.mobile)}
                          </DetailItem>
                          <DetailItem label="ایمیل" dir="ltr">
                            {u.email || "—"}
                          </DetailItem>
                          <DetailItem label="وضعیت">{meta.label}</DetailItem>
                          <DetailItem label="تاریخ عضویت">{formatJalali(new Date(u.created_at))}</DetailItem>
                          <DetailItem label="آخرین ورود">
                            {u.last_login_at ? formatJalali(new Date(u.last_login_at)) : "هنوز وارد نشده"}
                          </DetailItem>
                          <DetailItem label="شناسه">
                            <span dir="ltr" className="text-xs">
                              {u.id.slice(0, 8)}…
                            </span>
                          </DetailItem>
                          </DetailGrid>
                        </div>
                        <DetailSection title="نقش‌ها">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 ? (
                              <span className="text-sm text-muted-foreground">نقشی ندارد</span>
                            ) : (
                              u.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center gap-1 rounded-full bg-primary-tint px-2 py-1 text-xs text-accent-strong"
                                >
                                  {ROLE_FA[role] ?? role}
                                  {isOwner && role !== "owner" && (
                                    <button
                                      type="button"
                                      aria-label={`حذف نقش ${ROLE_FA[role] ?? role}`}
                                      disabled={busy === u.id}
                                      onClick={() => void changeRole(u, "remove", role)}
                                      className="rounded-full px-1 hover:bg-primary/15"
                                    >
                                      ×
                                    </button>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                          {isOwner && (
                            <div className="mt-3 flex items-center gap-2">
                              <Select
                                aria-label="افزودن نقش"
                                value={roleDraft[u.id] ?? ""}
                                onChange={(e) =>
                                  setRoleDraft((d) => ({ ...d, [u.id]: e.target.value }))
                                }
                                className="w-40"
                              >
                                <option value="">افزودن نقش…</option>
                                {GRANTABLE.filter((role) => !u.roles.includes(role)).map((role) => (
                                  <option key={role} value={role}>
                                    {ROLE_FA[role] ?? role}
                                  </option>
                                ))}
                              </Select>
                              <Button
                                size="sm"
                                variant="outline"
                                loading={busy === u.id}
                                disabled={!roleDraft[u.id]}
                                onClick={() => void changeRole(u, "add", roleDraft[u.id] ?? "")}
                              >
                                <ShieldCheck />
                                اعمال
                              </Button>
                            </div>
                          )}
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
