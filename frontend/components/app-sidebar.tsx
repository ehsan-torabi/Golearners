"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  CreditCardIcon,
  FolderOpenIcon,
  HomeIcon,
  LayoutGridIcon,
  ListOrderedIcon,
  MessageSquareIcon,
  NewspaperIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  StarIcon,
  TagsIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type SidebarGroupItem = {
  label: string;
  items: { href: string; label: string; exact?: boolean }[];
};

/* one icon per real route: the account menu reads like faradars «حساب کاربری»,
   a flat list with a small mark per entry. Routes without an entry render
   bare — the label carries the meaning. */
const ICONS: Record<string, LucideIcon> = {
  "/": HomeIcon,
  "/dashboard": BookOpenIcon,
  "/dashboard/orders": ReceiptTextIcon,
  "/dashboard/profile": UserRoundIcon,
  "/admin": LayoutGridIcon,
  "/admin/courses": BookOpenIcon,
  "/admin/categories": FolderOpenIcon,
  "/admin/reviews": StarIcon,
  "/admin/instructor": UserRoundIcon,
  "/admin/posts": NewspaperIcon,
  "/admin/media": CreditCardIcon,
  "/admin/orders": ShoppingBagIcon,
  "/admin/coupons": TagsIcon,
  "/admin/users": UsersIcon,
  "/admin/messages": MessageSquareIcon,
  "/admin/settings": SettingsIcon,
  "/admin/audit-logs": ListOrderedIcon,
};

/* account-menu style dashboard sider: white card, captioned groups, flat items
   with the active row tinted. Groups and items come from the caller, so every
   entry is a real route. */
export function AppSidebar({
  groups,
  title,
  subtitle,
  user,
  footer,
}: {
  groups: SidebarGroupItem[];
  title: string;
  subtitle?: string;
  user?: { name: string; mobile: string } | null;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar side="right" collapsible="offcanvas" className="bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-sidebar-foreground/70">{subtitle}</p>}
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="p-0 pb-1">
            <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/55">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.href];
                const active = isActive(item.href, item.exact);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                      className={cn(active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}
                    >
                      {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        {footer}
        {user && (
          <>
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="mt-0.5 text-xs text-sidebar-foreground/60" dir="ltr">
              {user.mobile}
            </p>
          </>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
