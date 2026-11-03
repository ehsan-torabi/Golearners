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
} from "@/components/admin/list-view";
import {
  ApiError,
  adminDeletePost,
  adminPublishPost,
  fetchBlogTaxonomy,
  type TaxonomyItem,
} from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  published: { label: "منتشرشده", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "warning" },
  archived: { label: "بایگانی", tone: "neutral" },
};

const STATUS_VALUES = ["published", "draft", "archived"];

const SORT_OPTIONS = [
  { value: "newest", label: "تازه‌ترین" },
  { value: "oldest", label: "قدیمی‌ترین" },
  { value: "published", label: "آخرین انتشار" },
  { value: "title", label: "عنوان" },
];

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  cover_media_id: string | null;
  cover_url: string;
  category_id: string | null;
  reading_minutes: number;
  published_at: string | null;
}

export default function AdminPostsPage() {
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [tag, setTag] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [taxonomy, setTaxonomy] = React.useState<{ categories: TaxonomyItem[]; tags: TaxonomyItem[] }>({
    categories: [],
    tags: [],
  });
  const [selected, setSelected] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<PostRow | null>(null);
  const [bulkRemoving, setBulkRemoving] = React.useState(false);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");

  const filters = React.useMemo(
    () => ({ q: search, status, category_id: categoryId, tag, sort }),
    [search, status, categoryId, tag, sort],
  );

  const list = useAdminList<PostRow>({ path: "/admin/posts", filters });
  const statusCounts = useFacetCounts({
    path: "/admin/posts",
    param: "status",
    filters: { q: search, category_id: categoryId, tag },
    values: STATUS_VALUES,
  });

  React.useEffect(() => {
    fetchBlogTaxonomy()
      .then((res) => setTaxonomy({ categories: res.categories ?? [], tags: res.tags ?? [] }))
      .catch(() => setTaxonomy({ categories: [], tags: [] }));
  }, []);

  async function setPublished(post: PostRow, publish: boolean) {
    setError("");
    setBusy(post.id);
    try {
      await adminPublishPost(post.id, publish);
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
      await adminDeletePost(removing.id);
      setRemoving(null);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف نوشته");
    } finally {
      setBusy("");
    }
  }

  async function bulkPublish(publish: boolean) {
    setError("");
    setBusy("bulk");
    try {
      for (const id of selected) {
        await adminPublishPost(id, publish);
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
        await adminDeletePost(id);
      }
      setBulkRemoving(false);
      setSelected([]);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف گروهی نوشته‌ها");
    } finally {
      setBusy("");
    }
  }

  const toggleSelected = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const allSelected = list.items.length > 0 && list.items.every((p) => selected.includes(p.id));

  const chips: ListChip[] = [];
  if (status) {
    chips.push({
      key: "status",
      label: `وضعیت: ${STATUS_FA[status]?.label ?? status}`,
      count: statusCounts[status] ?? null,
      onRemove: () => setStatus(""),
    });
  }
  if (categoryId) {
    const title = taxonomy.categories.find((c) => c.id === categoryId)?.title ?? categoryId;
    chips.push({ key: "category", label: `دسته: ${title}`, onRemove: () => setCategoryId("") });
  }
  if (tag) {
    const title = taxonomy.tags.find((t) => t.slug === tag)?.title ?? tag;
    chips.push({ key: "tag", label: `برچسب: ${title}`, onRemove: () => setTag("") });
  }

  return (
    <div className="space-y-4">
      <ListHeader
        title="نوشته‌های وبلاگ"
        count={list.loading ? null : list.total}
        unit="نوشته"
        action={<ButtonLink href="/admin/posts/new">نوشتهٔ تازه</ButtonLink>}
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
            searchValue={query}
            onSearchValue={setQuery}
            onSearchSubmit={() => setSearch(query.trim())}
            searchPlaceholder="عنوان یا متن نوشته"
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
                  <p className="mb-1 text-xs font-medium text-muted-foreground">دستهٔ وبلاگ</p>
                  <Select
                    aria-label="فیلتر دستهٔ وبلاگ"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full"
                  >
                    <option value="">همهٔ دسته‌ها</option>
                    {taxonomy.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">برچسب</p>
                  <Select aria-label="فیلتر برچسب" value={tag} onChange={(e) => setTag(e.target.value)} className="w-full">
                    <option value="">همهٔ برچسب‌ها</option>
                    {taxonomy.tags.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStatus("");
                    setCategoryId("");
                    setTag("");
                  }}
                >
                  پاک کردن فیلترها
                </Button>
              </div>
            }
          />
        )}

        {list.loading ? (
          <ListLoading label="در حال بارگذاری نوشته‌ها" />
        ) : list.items.length === 0 ? (
          <EmptyState
            title="نوشته‌ای با این فیلترها نیست"
            body="فیلترها را تغییر دهید یا نوشتهٔ تازه‌ای بنویسید."
            actionHref="/admin/posts/new"
            actionLabel="نوشتن نوشتهٔ تازه"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <ListCheckbox
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={(checked) => setSelected(checked ? list.items.map((p) => p.id) : [])}
                    label="انتخاب همهٔ نوشته‌ها"
                  />
                </TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">نوشته</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">دسته</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">زمان مطالعه</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">انتشار</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((p) => {
                const meta = STATUS_FA[p.status] ?? { label: p.status, tone: "neutral" as const };
                const category = taxonomy.categories.find((c) => c.id === p.category_id);
                const open = expanded === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <TableRow data-state={selected.includes(p.id) ? "selected" : undefined}>
                      <TableCell className="w-10">
                        <ListCheckbox
                          checked={selected.includes(p.id)}
                          onChange={() => toggleSelected(p.id)}
                          label={`انتخاب ${p.title}`}
                        />
                      </TableCell>
                      <TableCell className="text-start whitespace-normal">
                        <div className="flex items-center gap-3">
                          <ListThumb src={p.cover_url} alt={p.title} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/posts/${p.id}`}
                              className="block truncate font-medium text-foreground hover:text-accent-strong"
                            >
                              {p.title}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground" dir="ltr">
                              /blog/{p.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {category?.title ?? "—"}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {fa(p.reading_minutes)} دقیقه
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {p.published_at ? formatJalali(new Date(p.published_at)) : "—"}
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
                            onClick={() => setExpanded(open ? null : p.id)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <RowMenu
                            label={`کنش‌های ${p.title}`}
                            items={[
                              { label: "ویرایش", icon: <Pencil />, href: `/admin/posts/${p.id}` },
                              { label: "مشاهده در سایت", icon: <ExternalLink />, href: `/blog/${p.slug}` },
                              {
                                label: p.status === "published" ? "لغو انتشار" : "انتشار",
                                icon: p.status === "published" ? <EyeOff /> : <Eye />,
                                onSelect: () => void setPublished(p, p.status !== "published"),
                                separator: true,
                              },
                              {
                                label: "حذف",
                                icon: <Trash2 />,
                                variant: "destructive",
                                onSelect: () => setRemoving(p),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={7}>
                        <DetailGrid>
                          <DetailItem label="دستهٔ وبلاگ">{category?.title ?? "—"}</DetailItem>
                          <DetailItem label="وضعیت">{meta.label}</DetailItem>
                          <DetailItem label="زمان مطالعه">{fa(p.reading_minutes)} دقیقه</DetailItem>
                          <DetailItem label="کاور">{p.cover_media_id ? "دارد" : "ندارد"}</DetailItem>
                          <DetailItem label="زمان انتشار">
                            {p.published_at ? formatJalali(new Date(p.published_at)) : "—"}
                          </DetailItem>
                          <DetailItem label="نامک">
                            <span dir="ltr">{p.slug}</span>
                          </DetailItem>
                        </DetailGrid>
                        <DetailSection title="خلاصه">
                          <DetailCard title={p.title} subtitle={p.excerpt}>
                            {p.cover_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.cover_url}
                                alt={p.title}
                                className="mt-2 h-32 w-full rounded-md object-cover"
                              />
                            ) : null}
                          </DetailCard>
                          <ButtonLink size="sm" variant="ghost" href={`/admin/posts/${p.id}`} className="mt-2">
                            ویرایش نوشته
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
            <AlertDialogTitle>حذف نوشته</AlertDialogTitle>
            <AlertDialogDescription>«{removing?.title}» برای همیشه حذف می‌شود.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === removing?.id}
              onClick={() => void removeOne()}
            >
              حذف نوشته
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkRemoving} onOpenChange={setBulkRemoving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف گروهی نوشته‌ها</AlertDialogTitle>
            <AlertDialogDescription>
              {fa(selected.length)} نوشته برای همیشه حذف می‌شوند.
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
