import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getMe } from "@/lib/me-server";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

const groups = [
  {
    label: "یادگیری",
    items: [
      { href: "/dashboard", label: "دوره‌های من", exact: true },
      { href: "/dashboard/orders", label: "سفارش‌های من" },
    ],
  },
  {
    label: "حساب",
    items: [{ href: "/dashboard/profile", label: "پروفایل" }],
  },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  return (
    <AppShell
      groups={groups}
      title="داشبورد"
      subtitle="گوLearn"
      user={me ? { name: me.full_name, mobile: me.mobile } : null}
    >
      {children}
    </AppShell>
  );
}
