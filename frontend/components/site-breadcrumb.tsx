import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = { href?: string; label: string };

/* breadcrumb-block-01: last crumb is the current page, earlier ones link back. */
export function SiteBreadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="مسیر صفحه" className="mb-5">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <BreadcrumbItem key={`${item.label}-${i}`}>
                {last || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={item.href} />}>{item.label}</BreadcrumbLink>
                )}
                {!last && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}
