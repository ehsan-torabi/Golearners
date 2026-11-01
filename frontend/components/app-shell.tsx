"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AppSidebar, type SidebarGroupItem } from "@/components/app-sidebar";

/**
 * Dashboard shell (sidebar-03 block): collapsible sider on the inline-start
 * edge (right in RTL), content inset on the #f5f5f5 layout background.
 */
export function AppShell({
  groups,
  title,
  subtitle,
  user,
  footer,
  children,
}: {
  groups: SidebarGroupItem[];
  title: string;
  subtitle?: string;
  user?: { name: string; mobile: string } | null;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar groups={groups} title={title} subtitle={subtitle} user={user} footer={footer} />
      <SidebarInset className="min-h-svh bg-background">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-2 data-vertical:h-4 data-vertical:self-auto" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="ms-auto">
            <ThemeToggle />
          </span>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
