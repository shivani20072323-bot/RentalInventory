import { Link, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, Boxes, LayoutGrid, RotateCcw, Settings, ArrowLeftRight } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useInventory } from "@/lib/inventory-store";
import { isOverdue } from "@/lib/rental-utils";

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { rentals } = useInventory();
  const overdue = rentals.filter((r) => isOverdue(r)).length;
  const pending = rentals.filter((r) => r.status === "pending").length;

  const main = [
    { title: "Overview", url: "/", icon: LayoutGrid },
    { title: "Equipment", url: "/equipment", icon: Boxes },
    { title: "Rentals", url: "/rentals", icon: ArrowLeftRight, badge: pending },
    { title: "Returns", url: "/returns", icon: RotateCcw },
    { title: "Overdue Items", url: "/overdue", icon: AlertTriangle, badge: overdue, danger: true },
  ] as const;
  const insights = [
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Settings", url: "/settings", icon: Settings },
  ] as const;

  const renderItems = (items: readonly { title: string; url: string; icon: typeof LayoutGrid; badge?: number; danger?: boolean }[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.title}>
          <Link to={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
        {!!item.badge && (
          <SidebarMenuBadge className={item.danger ? "bg-destructive text-destructive-foreground" : "bg-sidebar-accent"}>
            {item.badge}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-4" />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
            RentalInventory
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(main)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(insights)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-md p-2 group-data-[collapsible=icon]:p-0">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">SC</span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">Shivani C</p>
            <p className="truncate text-xs">Inventory admin</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
