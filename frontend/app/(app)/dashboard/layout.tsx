import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { requireUser } from "@/lib/me-server";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

const groups = [
  {
    label: "عمومی",
    items: [{ href: "/", label: "خانهٔ سایت" }],
  },
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
  // guests are sent to the login page, with a way back to where they wanted to go
  const me = await requireUser();
  return (
    <AppShell
      groups={groups}
      title="داشبورد"
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
