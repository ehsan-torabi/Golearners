import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getMe } from "@/lib/me-server";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

const groups = [
  {
    label: "گزارش‌ها",
    items: [{ href: "/admin", label: "نمای کلی", exact: true }],
  },
  {
    label: "مدیریت",
    items: [
      { href: "/admin/courses", label: "دوره‌ها" },
      { href: "/admin/orders", label: "سفارش‌ها" },
      { href: "/admin/users", label: "کاربران" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  return (
    <AppShell
      groups={groups}
      title="مدیریت"
      subtitle="گوLearn"
      user={me ? { name: me.full_name, mobile: me.mobile } : null}
    >
      {children}
    </AppShell>
  );
}
