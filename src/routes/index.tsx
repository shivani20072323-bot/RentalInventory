import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Boxes, CheckCircle2, Clock, PackageOpen, Plus } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { EquipmentThumb, Panel, PageHeader, StatCard, StatusBadge, EmptyState, tableCls } from "@/components/app/ui-bits";
import { RentalFormDialog } from "@/components/app/rental-form-dialog";
import { useInventory } from "@/lib/inventory-store";
import { addDays, availableQuantity, daysBetween, displayStatus, formatDate, isOverdue, overdueDays, todayISO } from "@/lib/rental-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · RentalInventory" },
      { name: "description", content: "Live snapshot of equipment availability, active rentals, upcoming returns and overdue items." },
      { property: "og:title", content: "Overview · RentalInventory" },
      { property: "og:description", content: "Live snapshot of equipment availability, rentals and overdue items." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { equipment, rentals, getEquipment } = useInventory();
  const [open, setOpen] = useState(false);
  const today = todayISO();

  const totalUnits = equipment.reduce((s, e) => s + e.totalQuantity, 0);
  const availableUnits = equipment.reduce((s, e) => s + availableQuantity(e, rentals), 0);
  const rentedUnits = totalUnits - availableUnits;
  const active = rentals.filter((r) => r.status === "active");
  const overdue = active.filter((r) => isOverdue(r, today)).sort((a, b) => a.expectedReturnDate.localeCompare(b.expectedReturnDate));
  const upcoming = active
    .filter((r) => r.expectedReturnDate >= today && r.expectedReturnDate <= addDays(today, 7))
    .sort((a, b) => a.expectedReturnDate.localeCompare(b.expectedReturnDate));
  const recent = [...rentals].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).slice(0, 6);
  const utilisation = totalUnits ? Math.round((rentedUnits / totalUnits) * 100) : 0;

  const pie = [
    { name: "Available", value: availableUnits, color: "var(--chart-1)" },
    { name: "Rented", value: rentedUnits, color: "var(--chart-2)" },
  ];

  return (
    <>
      <PageHeader
        title="Good afternoon, Shivani"
        description={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + " · here's what's happening with your inventory."}
        actions={<Button onClick={() => setOpen(true)}><Plus /> New rental</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total equipment" value={totalUnits} icon={Boxes} hint={`${equipment.length} distinct items`} />
        <StatCard label="Available" value={availableUnits} icon={CheckCircle2} tone="success" hint={`${100 - utilisation}% of stock ready to lend`} />
        <StatCard label="Currently rented" value={rentedUnits} icon={PackageOpen} tone="brand" hint={`${active.length} active rentals`} />
        <StatCard label="Overdue rentals" value={overdue.length} icon={AlertTriangle} tone={overdue.length ? "danger" : "default"} hint={overdue.length ? "Needs follow-up" : "All on schedule"} />
      </div>

      {overdue.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive-soft p-4 sm:flex-row sm:items-center">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-destructive">{overdue.length} rental{overdue.length > 1 ? "s are" : " is"} overdue</p>
            <p className="text-muted-foreground">
              {overdue.slice(0, 3).map((r) => `${getEquipment(r.equipmentId)?.name} (${r.borrowerName}, ${overdueDays(r, today)}d)`).join(" · ")}
            </p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/overdue">Review <ArrowRight /></Link></Button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Recent rental activity" description="Latest requests and checkouts" className="lg:col-span-2"
          action={<Button asChild variant="ghost" size="sm"><Link to="/rentals">View all <ArrowRight /></Link></Button>}>
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead><tr>
                <th className={tableCls.th}>Equipment</th><th className={tableCls.th}>Borrower</th>
                <th className={tableCls.th}>Rented</th><th className={tableCls.th}>Due</th><th className={tableCls.th}>Status</th>
              </tr></thead>
              <tbody>
                {recent.map((r) => {
                  const e = getEquipment(r.equipmentId);
                  return (
                    <tr key={r.id} className={tableCls.tr}>
                      <td className={tableCls.td}>
                        <div className="flex items-center gap-3">
                          {e && <EquipmentThumb category={e.category} imageUrl={e.imageUrl} size="sm" />}
                          <span className="font-medium">{e?.name ?? "Deleted item"}</span>
                        </div>
                      </td>
                      <td className={tableCls.td}>{r.borrowerName}</td>
                      <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>{formatDate(r.startDate)}</td>
                      <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>{formatDate(r.expectedReturnDate)}</td>
                      <td className={tableCls.td}><StatusBadge status={displayStatus(r, today)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Equipment availability" description="Units across all items">
          <div className="relative h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={2} stroke="none">
                  {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><p className="text-2xl font-semibold tabular">{utilisation}%</p><p className="text-xs text-muted-foreground">in use</p></div>
            </div>
          </div>
          <div className="space-y-3 border-t px-5 py-4">
            {pie.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: p.color }} />{p.name}</span>
                <span className="font-medium tabular">{p.value} units</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming returns" description="Due in the next 7 days">
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing due this week" description="Active rentals due within 7 days will appear here." />
          ) : (
            <ul className="divide-y">
              {upcoming.map((r) => {
                const e = getEquipment(r.equipmentId);
                const d = daysBetween(today, r.expectedReturnDate);
                return (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                    {e && <EquipmentThumb category={e.category} imageUrl={e.imageUrl} size="sm" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.borrowerName} · {r.borrowerContact}</p>
                    </div>
                    <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                      <Clock className="size-3.5" />{d === 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Overdue alerts" description="Past the expected return date"
          action={<Button asChild variant="ghost" size="sm"><Link to="/overdue">Tracker <ArrowRight /></Link></Button>}>
          {overdue.length === 0 ? (
            <EmptyState title="No overdue items" description="Every active rental is within its return window." />
          ) : (
            <ul className="divide-y">
              {overdue.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid size-8 place-items-center rounded-md bg-destructive-soft text-destructive"><AlertTriangle className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{getEquipment(r.equipmentId)?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.borrowerName} · due {formatDate(r.expectedReturnDate)}</p>
                  </div>
                  <span className="rounded-full bg-destructive-soft px-2 py-0.5 text-xs font-semibold text-destructive tabular">{overdueDays(r, today)}d late</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <RentalFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
