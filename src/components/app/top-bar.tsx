import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Search, UserRound, Settings, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useInventory } from "@/lib/inventory-store";
import { isOverdue, overdueDays } from "@/lib/rental-utils";

const titles: Record<string, string> = {
  "/": "Overview", "/equipment": "Equipment", "/rentals": "Rentals", "/returns": "Returns",
  "/overdue": "Overdue Items", "/reports": "Reports", "/settings": "Settings",
};

export function TopBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { rentals, getEquipment } = useInventory();
  const overdue = rentals.filter((r) => isOverdue(r));
  const pending = rentals.filter((r) => r.status === "pending");
  const count = overdue.length + pending.length;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="h-5 w-px bg-border" />
      <h1 className="text-sm font-medium">{titles[path] ?? "RentalInventory"}</h1>
      <form
        className="ml-auto hidden w-full max-w-xs items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-sm shadow-card focus-within:ring-2 focus-within:ring-ring/30 sm:flex"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/equipment", search: { q: q.trim() || undefined } });
        }}
      >
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment…" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" aria-label="Search equipment" />
        <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">↵</kbd>
      </form>
      <Popover>
        <PopoverTrigger className="relative ml-auto grid size-9 place-items-center rounded-md hover:bg-muted sm:ml-0" aria-label="Notifications">
          <Bell className="size-4" />
          {count > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <p className="border-b px-4 py-3 text-sm font-semibold">Notifications</p>
          <div className="max-h-80 overflow-y-auto">
            {count === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>}
            {overdue.map((r) => (
              <Link key={r.id} to="/overdue" className="block border-b px-4 py-3 text-sm hover:bg-muted/50">
                <span className="font-medium text-destructive">Overdue {overdueDays(r)}d</span> · {getEquipment(r.equipmentId)?.name}
                <p className="text-xs text-muted-foreground">{r.borrowerName}</p>
              </Link>
            ))}
            {pending.map((r) => (
              <Link key={r.id} to="/rentals" className="block border-b px-4 py-3 text-sm hover:bg-muted/50">
                <span className="font-medium text-warning">Awaiting approval</span> · {getEquipment(r.equipmentId)?.name}
                <p className="text-xs text-muted-foreground">{r.borrowerName} · {r.id}</p>
              </Link>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open admin profile menu">
            SC
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Shivani C</span>
              <span className="text-xs text-muted-foreground">Inventory administrator</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/settings"><UserRound className="mr-2 size-4"/>Profile & settings</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/"><LayoutDashboard className="mr-2 size-4"/>Dashboard</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 size-4"/>Preferences</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
