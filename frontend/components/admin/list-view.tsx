"use client";

/* Shared admin list framework.

   The ProAcc table pattern: a pill toolbar with removable filter chips, a
   faceted body whose rows carry a kebab menu, and an inline detail panel
   that expands under the row it belongs to. Every admin list page composes
   these pieces so the console reads as one surface.

   Colours stay on the GoLearn tokens (indigo primary, hairline borders);
   only the layout and interaction come from the reference. */

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  MoreVertical,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ApiError, fetchAdmin } from "@/lib/admin";
import { cn, fa } from "@/lib/utils";

export type SortOption = { value: string; label: string };

/** An applied filter, shown as a removable pill with an optional count. */
export type ListChip = {
  key: string;
  label: string;
  count?: number | null;
  onRemove: () => void;
};

export type RowMenuItem = {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onSelect?: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  separator?: boolean;
};

/* ---------- page head ---------- */

export function ListHeader({
  title,
  count,
  unit,
  action,
}: {
  title: string;
  count: number | null;
  unit: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="reveal text-xl leading-7 text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count === null ? `در حال شمارش ${unit}…` : `${fa(count)} ${unit} ثبت شده است.`}
        </p>
      </div>
      {action}
    </header>
  );
}

/* ---------- toolbar ---------- */

export function ListToolbar({
  searchValue,
  onSearchValue,
  onSearchSubmit,
  searchPlaceholder = "جست‌وجو…",
  chips = [],
  filters,
  filterLabel = "فیلتر",
  sort,
  toggle,
  trailing,
}: {
  searchValue: string;
  onSearchValue: (value: string) => void;
  onSearchSubmit: () => void;
  searchPlaceholder?: string;
  chips?: ListChip[];
  filters?: React.ReactNode;
  filterLabel?: string;
  sort?: { value: string; options: SortOption[]; onChange: (value: string) => void };
  toggle?: { checked: boolean; onChange: (value: boolean) => void; label: string };
  trailing?: React.ReactNode;
}) {
  const sortLabel = sort?.options.find((o) => o.value === sort.value)?.label ?? "ترتیب";
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-variant px-4 py-3">
      <form
        className="relative"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
      >
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchValue(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-9 w-64 rounded-full bg-muted ps-9 pe-3"
        />
      </form>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-primary-tint ps-3 pe-1 text-xs text-accent-strong"
        >
          {chip.label}
          {chip.count != null && (
            <span className="rounded-full bg-card px-1.5 font-medium text-primary">{fa(chip.count)}</span>
          )}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`حذف فیلتر ${chip.label}`}
            className="grid size-5 place-items-center rounded-full transition-colors hover:bg-primary/15"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <div className="ms-auto flex flex-wrap items-center gap-2">
        {filters && (
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 rounded-full px-3">
                  <SlidersHorizontal />
                  {filterLabel}
                </Button>
              }
            />
            <PopoverContent className="w-72 p-4">{filters}</PopoverContent>
          </Popover>
        )}
        {sort && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 rounded-full px-3">
                  {sortLabel}
                  <ChevronDown />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="min-w-40">
              {sort.options.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => sort.onChange(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {toggle && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch size="sm" checked={toggle.checked} onCheckedChange={toggle.onChange} />
            {toggle.label}
          </label>
        )}
        {trailing}
      </div>
    </div>
  );
}

/* ---------- row furniture ---------- */

/** Kebab menu for one row. */
export function RowMenu({ items, label = "کنش‌ها" }: { items: RowMenuItem[]; label?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label}>
            <MoreVertical />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-44">
        {items.map((item) => (
          <React.Fragment key={item.label}>
            {item.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant={item.variant}
              disabled={item.disabled}
              render={item.href ? <Link href={item.href} /> : undefined}
              onClick={item.onSelect}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Row leading thumbnail: a cover image when there is one, an icon otherwise. */
export function ListThumb({ src, alt, fallback }: { src?: string | null; alt: string; fallback?: React.ReactNode }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
      ) : (
        fallback ?? <span className="size-2 rounded-full bg-border" />
      )}
    </span>
  );
}

/* ---------- selection ---------- */

export function ListCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <Checkbox
      aria-label={label}
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={(value) => onChange(value === true)}
    />
  );
}

/** Bar that replaces the toolbar while rows are selected. */
export function ListSelectionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-variant bg-primary-tint px-4 py-3">
      <span className="text-sm font-medium text-accent-strong">{fa(count)} مورد انتخاب شده</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <Button size="sm" variant="ghost" className="ms-auto" onClick={onClear}>
        لغو انتخاب
      </Button>
    </div>
  );
}

/* ---------- body states ---------- */

export function ListLoading({ label }: { label: string }) {
  return (
    <div className="space-y-3 p-6" aria-label={label}>
      <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function ListPagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border-variant px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        صفحهٔ {fa(page)} از {fa(pages)}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          قبلی
        </Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          بعدی
        </Button>
      </div>
    </div>
  );
}

/* ---------- expanded row ---------- */

/** Full-width panel under a row; renders inside a table as one wide cell. */
export function ListDetailRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border-variant bg-muted/40">
      <td colSpan={colSpan} className="p-0 align-top">
        <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">{children}</div>
      </td>
    </tr>
  );
}

/** Key/value grid inside the expanded panel. */
export function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</div>;
}

export function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 truncate text-sm text-foreground">{children}</div>
    </div>
  );
}

export function DetailSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <p className="mb-2 text-sm font-semibold text-foreground">
        {title}
        {count != null && <span className="ms-1 font-normal text-muted-foreground">{fa(count)}</span>}
      </p>
      {children}
    </section>
  );
}

export function DetailCard({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-control border border-border-variant bg-card p-3">
      <p className="truncate text-sm font-medium text-foreground">{title}</p>
      {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}

/* ---------- data hooks ---------- */

/**
 * Loads one page of an admin list endpoint.
 *
 * `filters` is the query without the page: changing any value rewinds to
 * page 1, so the caller never has to reset the page by hand.
 */
export function useAdminList<T>({
  path,
  filters = {},
  perPage = 20,
}: {
  path: string;
  filters?: Record<string, string | number | boolean | undefined | null>;
  perPage?: number;
}) {
  const signature = JSON.stringify(Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)));
  const [state, setState] = React.useState({ signature, page: 1 });
  const page = state.signature === signature ? state.page : 1;
  const [items, setItems] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    setLoading(true);
    fetchAdmin<{ data: T[]; meta: { total: number } }>(`${path}?${params}`)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, signature, page, perPage, nonce]);

  return {
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
    loading,
    error,
    setPage: (next: number) => setState({ signature, page: next }),
    reload: () => setNonce((n) => n + 1),
  };
}

/**
 * Counts per facet value, the way the reference table badges its filter
 * chips. Each value costs one cheap request (a single row, the total is
 * all we read), so keep the value list short.
 */
export function useFacetCounts({
  path,
  param,
  filters = {},
  values,
}: {
  path: string;
  param: string;
  filters?: Record<string, string | number | boolean | undefined | null>;
  values: string[];
}) {
  const signature = JSON.stringify([
    path,
    param,
    Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)),
    values,
  ]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (values.length === 0) return;
    let cancelled = false;
    const base = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") base.set(key, String(value));
    });
    Promise.all(
      values.map(async (value) => {
        const params = new URLSearchParams(base);
        params.set(param, value);
        params.set("page", "1");
        params.set("per_page", "1");
        try {
          const res = await fetchAdmin<{ meta: { total: number } }>(`${path}?${params}`);
          return [value, res.meta?.total ?? 0] as const;
        } catch {
          return [value, 0] as const;
        }
      }),
    ).then((pairs) => {
      if (cancelled) return;
      setCounts(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  return counts;
}
