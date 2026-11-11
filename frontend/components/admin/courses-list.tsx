"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Eye, EyeOff, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
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
  ListCheckbox,
  ListDetailRow,
  ListHeader,
  ListLoading,
  ListPagination,
  ListSelectionBar,
  ListThumb,
  ListToolbar,
  RowMenu,
  useAdminList,
  useFacetCounts,
  type ListChip,
  ListError,
} from "@/components/admin/list-view";
import {
  ApiError,
  adminDeleteCourse,
  adminPublishCourse,
  fetchCourseCategories,
  type TaxonomyItem,
} from "@/lib/admin";
import { formatTomanFromRial, LEVEL_FA, type CourseSummary } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  published: { label: "منتشرشده", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "warning" },
  archived: { label: "بایگانی", tone: "neutral" },
};

const STATUS_VALUES = ["published", "draft", "archived"];

const LEVEL_VALUES = ["beginner", "intermediate", "advanced"];

const SORT_OPTIONS = [
  { value: "newest", label: "تازه‌ترین" },
  { value: "oldest", label: "قدیمی‌ترین" },
  { value: "title", label: "عنوان" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "popular", label: "ویژه و پرطرفدار" },
];

/** The admin course list row: the fields GET /admin/courses actually returns. */
interface CourseRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: CourseSummary["level"];
  status: string;
  price_rial: number;
  compare_at_price_rial: number | null;
  is_featured: boolean;
  cover_media_id: string | null;
  cover_url: string;
  created_at: string;
  published_at: string | null;
  has_promo: boolean;
}

export function CoursesList() {
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [featured, setFeatured] = React.useState(false);
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [priceDraft, setPriceDraft] = React.useState({ min: "", max: "" });
  const [sort, setSort] = React.useState("newest");
  const [categories, setCategories] = React.useState<TaxonomyItem[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<CourseRow | null>(null);
  const [bulkRemoving, setBulkRemoving] = React.useState(false);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");

  const filters = React.useMemo(
    () => ({
      q: search,
      status,
      level,
      category,
      sort,
      featured: featured ? "1" : "",
      min_price: minPrice,
      max_price: maxPrice,
    }),
    [search, status, level, category, sort, featured, minPrice, maxPrice],
  );

  const list = useAdminList<CourseRow>({ path: "/admin/courses", filters });
  const statusCounts = useFacetCounts({
    path: "/admin/courses",
    param: "status",
    filters: { q: search, level, category, featured: featured ? "1" : "", min_price: minPrice, max_price: maxPrice },
    values: STATUS_VALUES,
  });

  React.useEffect(() => {
    fetchCourseCategories()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // the price fields are drafted locally and committed on blur/enter
  React.useEffect(() => {
    setPriceDraft({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  const commitPrice = () => {
    setMinPrice(priceDraft.min);
    setMaxPrice(priceDraft.max);
  };

  async function setPublished(course: CourseRow, publish: boolean) {
    setError("");
    setBusy(course.id);
    try {
      await adminPublishCourse(course.id, publish);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت انتشار ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  async function removeOne() {
    if (!removing) return;
    setError("");
    setBusy(removing.id);
    try {
      await adminDeleteCourse(removing.id);
      setRemoving(null);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف دوره");
    } finally {
      setBusy("");
    }
  }

  async function bulkPublish(publish: boolean) {
    setError("");
    setBusy("bulk");
    try {
      for (const id of selected) {
        await adminPublishCourse(id, publish);
      }
      setSelected([]);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت گروهی ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  async function bulkRemove() {
    setError("");
    setBusy("bulk");
    try {
      for (const id of selected) {
        await adminDeleteCourse(id);
      }
      setBulkRemoving(false);
      setSelected([]);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف گروهی دوره‌ها");
    } finally {
      setBusy("");
    }
  }

  const toggleSelected = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const allSelected = list.items.length > 0 && list.items.every((c) => selected.includes(c.id));

  const chips: ListChip[] = [];
  if (status) {
    chips.push({
      key: "status",
      label: `وضعیت: ${STATUS_FA[status]?.label ?? status}`,
      count: statusCounts[status] ?? null,
      onRemove: () => setStatus(""),
    });
  }
  if (level) {
    chips.push({
      key: "level",
      label: `سطح: ${LEVEL_FA[level as CourseSummary["level"]] ?? level}`,
      onRemove: () => setLevel(""),
    });
  }
  if (category) {
    const title = categories.find((c) => c.slug === category)?.title ?? category;
    chips.push({ key: "category", label: `دسته: ${title}`, onRemove: () => setCategory("") });
  }
  if (featured) {
    chips.push({ key: "featured", label: "فقط ویژه‌ها", onRemove: () => setFeatured(false) });
  }
  if (minPrice || maxPrice) {
    chips.push({
      key: "price",
      label: `قیمت: ${minPrice || "۰"} تا ${maxPrice || "∞"} تومان`,
      onRemove: () => {
        setMinPrice("");
        setMaxPrice("");
      },
    });
  }

  const clearFilters = () => {
    setStatus("");
    setLevel("");
    setCategory("");
    setFeatured(false);
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <div className="space-y-4">
      <ListHeader
        title="دوره‌ها"
        count={list.loading ? null : list.total}
        unit="دوره"
        action={<ButtonLink href="/admin/courses/new">دورهٔ تازه</ButtonLink>}
      />

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        {selected.length > 0 ? (
          <ListSelectionBar count={selected.length} onClear={() => setSelected([])}>
            <Button size="sm" variant="outline" loading={busy === "bulk"} onClick={() => void bulkPublish(true)}>
              انتشار گروهی
            </Button>
            <Button size="sm" variant="outline" loading={busy === "bulk"} onClick={() => void bulkPublish(false)}>
              لغو انتشار
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkRemoving(true)}>
              حذف
            </Button>
          </ListSelectionBar>
        ) : (
          <ListToolbar
            search={{
              value: query,
              onChange: setQuery,
              onSubmit: () => setSearch(query.trim()),
              placeholder: "عنوان یا نامک دوره",
            }}
            chips={chips}
            sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
            filters={
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">وضعیت</p>
                  <Select aria-label="فیلتر وضعیت" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
                    <option value="">همهٔ وضعیت‌ها</option>
                    {STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_FA[value].label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">سطح</p>
                  <Select aria-label="فیلتر سطح" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full">
                    <option value="">همهٔ سطوح</option>
                    {LEVEL_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {LEVEL_FA[value as CourseSummary["level"]]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">دسته‌بندی</p>
                  <Select aria-label="فیلتر دسته‌بندی" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full">
                    <option value="">همهٔ دسته‌ها</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">محدودهٔ قیمت (تومان)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      inputMode="numeric"
                      aria-label="حداقل قیمت"
                      placeholder="از"
                      value={priceDraft.min}
                      onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value.replace(/\D/g, "") }))}
                      onBlur={commitPrice}
                      onKeyDown={(e) => e.key === "Enter" && commitPrice()}
                    />
                    <Input
                      inputMode="numeric"
                      aria-label="حداکثر قیمت"
                      placeholder="تا"
                      value={priceDraft.max}
                      onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value.replace(/\D/g, "") }))}
                      onBlur={commitPrice}
                      onKeyDown={(e) => e.key === "Enter" && commitPrice()}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={featured}
                    onCheckedChange={(value) => setFeatured(value === true)}
                  />
                  فقط دوره‌های ویژه
                </label>
                <Button size="sm" variant="ghost" className="w-full" onClick={clearFilters}>
                  پاک کردن فیلترها
                </Button>
              </div>
            }
          />
        )}

        <ListError error={list.error} />
        {list.loading ? (
          <ListLoading label="در حال بارگذاری دوره‌ها" />
        ) : list.items.length === 0 ? (
          <EmptyState
            title="دوره‌ای با این فیلترها نیست"
            body="فیلترها را تغییر دهید یا دورهٔ تازه‌ای بسازید."
            actionHref="/admin/courses/new"
            actionLabel="ساخت دورهٔ تازه"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <ListCheckbox
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={(checked) =>
                      setSelected(checked ? list.items.map((c) => c.id) : [])
                    }
                    label="انتخاب همهٔ دوره‌ها"
                  />
                </TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">دوره</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">سطح</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">قیمت</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((c) => {
                const meta = STATUS_FA[c.status] ?? { label: c.status, tone: "neutral" as const };
                const open = expanded === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <TableRow data-state={selected.includes(c.id) ? "selected" : undefined}>
                      <TableCell className="w-10">
                        <ListCheckbox
                          checked={selected.includes(c.id)}
                          onChange={() => toggleSelected(c.id)}
                          label={`انتخاب ${c.title}`}
                        />
                      </TableCell>
                      <TableCell className="text-start whitespace-normal">
                        <div className="flex items-center gap-3">
                          <ListThumb src={c.cover_url} alt={c.title} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/courses/${c.id}`}
                              className="block truncate font-medium text-foreground hover:text-accent-strong"
                            >
                              {c.title}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground" dir="ltr">
                              /courses/{c.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {LEVEL_FA[c.level] ?? c.level}
                      </TableCell>
                      <TableCell className="text-start">
                        {c.price_rial > 0 ? formatTomanFromRial(c.price_rial) : "رایگان"}
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
                            onClick={() => setExpanded(open ? null : c.id)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <RowMenu
                            label={`کنش‌های ${c.title}`}
                            items={[
                              { label: "ویرایش", icon: <Pencil />, href: `/admin/courses/${c.id}` },
                              { label: "مشاهده در سایت", icon: <ExternalLink />, href: `/courses/${c.slug}` },
                              {
                                label: c.status === "published" ? "لغو انتشار" : "انتشار",
                                icon: c.status === "published" ? <EyeOff /> : <Eye />,
                                onSelect: () => void setPublished(c, c.status !== "published"),
                                separator: true,
                              },
                              {
                                label: "حذف",
                                icon: <Trash2 />,
                                variant: "destructive",
                                onSelect: () => setRemoving(c),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={6}>
                        <DetailGrid>
                          <DetailItem label="سطح">{LEVEL_FA[c.level] ?? c.level}</DetailItem>
                          <DetailItem label="وضعیت">{meta.label}</DetailItem>
                          <DetailItem label="قیمت">
                            {c.price_rial > 0 ? formatTomanFromRial(c.price_rial) : "رایگان"}
                          </DetailItem>
                          <DetailItem label="قیمت پیش از تخفیف">
                            {c.compare_at_price_rial ? formatTomanFromRial(c.compare_at_price_rial) : "ندارد"}
                          </DetailItem>
                          <DetailItem label="ویدیوی معرفی">{c.has_promo ? "دارد" : "ندارد"}</DetailItem>
                          <DetailItem label="نمایش ویژه">{c.is_featured ? "بله" : "خیر"}</DetailItem>
                          <DetailItem label="تاریخ ساخت">{formatJalali(new Date(c.created_at))}</DetailItem>
                          <DetailItem label="زمان انتشار">
                            {c.published_at ? formatJalali(new Date(c.published_at)) : "منتشر نشده"}
                          </DetailItem>
                        </DetailGrid>
                        <DetailSection title="پیش‌نمایش">
                          <DetailCard title={c.title} subtitle={c.summary}>
                            {c.cover_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={c.cover_url}
                                alt={c.title}
                                className="mt-2 h-32 w-full rounded-md object-cover"
                              />
                            ) : null}
                          </DetailCard>
                          <ButtonLink
                            size="sm"
                            variant="ghost"
                            href={`/admin/courses/${c.id}`}
                            className="mt-2"
                          >
                            ویرایش دوره
                          </ButtonLink>
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

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دوره</AlertDialogTitle>
            <AlertDialogDescription>
              «{removing?.title}» برای همیشه حذف می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === removing?.id}
              onClick={() => void removeOne()}
            >
              حذف دوره
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkRemoving} onOpenChange={setBulkRemoving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف گروهی دوره‌ها</AlertDialogTitle>
            <AlertDialogDescription>
              {fa(selected.length)} دوره برای همیشه حذف می‌شوند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === "bulk"}
              onClick={() => void bulkRemove()}
            >
              حذف همه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
