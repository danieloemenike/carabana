"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, Martini, PanelLeftClose, Shield, Sparkles, UtensilsCrossed } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { href: "/dashboard/club/regular", label: "Club - Regular", icon: Sparkles },
  { href: "/dashboard/club/vip", label: "Club - VIP", icon: Martini },
  { href: "/dashboard/lounge/regular", label: "Lounge - Regular", icon: Sparkles },
  { href: "/dashboard/lounge/madiba-sky", label: "Lounge - Madiba + Sky", icon: Shield },
  { href: "/dashboard/lounge/kitchen", label: "Lounge - Kitchen", icon: UtensilsCrossed },
  { href: "/dashboard/categories", label: "All Categories", icon: FolderTree, exact: false },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Carabana</p>
              <p className="text-xs text-sidebar-foreground/60">Admin Dashboard</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminLinks.map((link) => {
                const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                const Icon = link.icon;

                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={link.href} onClick={() => setMobileOpen(false)}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]/sidebar:sr-only">
          Keep menus fresh and up to date.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
