"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";

export type SidebarGroupItem = {
  label: string;
  items: { href: string; label: string; exact?: boolean }[];
};

/* sidebar-03 block: collapsible menu groups in the dashboard sider.
   Groups and items come from the caller, so every entry is a real route. */
export function AppSidebar({
  groups,
  title,
  subtitle,
  user,
}: {
  groups: SidebarGroupItem[];
  title: string;
  subtitle?: string;
  user?: { name: string; mobile: string } | null;
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar side="right" collapsible="offcanvas" className="bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-sidebar-foreground/70">{subtitle}</p>}
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/60">{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={<SidebarMenuButton className="w-full" tooltip={group.label} />}
                  >
                    <span>{group.label}</span>
                    <ChevronDownIcon className="ms-auto size-4 opacity-60 transition-transform group-data-open/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            isActive={isActive(item.href, item.exact)}
                            tooltip={item.label}
                            render={<Link href={item.href} />}
                          >
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {user && (
        <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
          <p className="mt-0.5 text-xs text-sidebar-foreground/60" dir="ltr">
            {user.mobile}
          </p>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
