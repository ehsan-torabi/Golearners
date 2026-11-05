import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { requireAdmin } from "@/lib/me-server";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

/* the admin console has its own structure: reporting first, then the content
   and commerce sections, then the technical ones (media, audit log). */
const groups = [
  {
    label: "گزارش‌ها",
    items: [{ href: "/admin", label: "نمای کلی", exact: true }],
  },
  {
    label: "محتوا",
    items: [
      { href: "/admin/courses", label: "دوره‌ها" },
      { href: "/admin/categories", label: "دسته‌بندی‌ها" },
      { href: "/admin/reviews", label: "نظرهای دانشجوها" },
      { href: "/admin/posts", label: "نوشته‌های وبلاگ" },
      { href: "/admin/series", label: "سری‌های مطالب" },
      { href: "/admin/comments", label: "دیدگاه‌ها" },
      { href: "/admin/media", label: "رسانه‌ها" },
      { href: "/admin/instructor", label: "پروفایل مدرس" },
    ],
  },
  {
    label: "فروش",
    items: [
      { href: "/admin/orders", label: "سفارش‌ها" },
      { href: "/admin/coupons", label: "کدهای تخفیف" },
    ],
  },
  {
    label: "کاربران",
    items: [
      { href: "/admin/users", label: "کاربران" },
      { href: "/admin/messages", label: "پیام‌های تماس" },
    ],
  },
  {
    label: "سیستم",
    items: [
      { href: "/admin/settings", label: "تنظیمات" },
      { href: "/admin/audit-logs", label: "گزارش رویدادها" },
    ],
  },
  {
    label: "عمومی",
    items: [{ href: "/", label: "خانهٔ سایت" }],
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // guests go to the login page, non-admins back to their dashboard
  const me = await requireAdmin();
  return (
    <AppShell
      groups={groups}
      title="مدیریت"
      subtitle="گوLearn"
      user={{ name: me.full_name, mobile: me.mobile }}
      footer={
        <LogoutButton className="mb-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      }
    >
      {children}
    </AppShell>
  );
}
