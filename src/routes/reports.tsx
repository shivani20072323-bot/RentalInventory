import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Boxes, CalendarDays, Download, PackageCheck, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatCard } from "@/components/app/ui-bits";
import { useInventory } from "@/lib/inventory-store";
import { availableQuantity, displayStatus, isOverdue } from "@/lib/rental-utils";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · RentalInventory" }] }),
  component: ReportsPage,
});

const COLORS = ["#4263eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function ReportsPage() {
  const { equipment, rentals } = useInventory();
  const totalUnits = equipment.reduce((sum, e) => sum + e.totalQuantity, 0);
  const availableUnits = equipment.reduce((sum, e) => sum + availableQuantity(e, rentals), 0);
  const rentedUnits = totalUnits - availableUnits;
  const overdueCount = rentals.filter((r) => isOverdue(r)).length;
  const activeCount = rentals.filter((r) => r.status === "active").length;
  const returnedCount = rentals.filter((r) => r.status === "returned").length;
  const pendingCount = rentals.filter((r) => r.status === "pending").length;

  const categoryData = Array.from(new Set(equipment.map((e) => e.category))).map((category) => {
    const items = equipment.filter((e) => e.category === category);
    return { category, total: items.reduce((sum, e) => sum + e.totalQuantity, 0), available: items.reduce((sum, e) => sum + availableQuantity(e, rentals), 0) };
  });
  const statusData = [
    { name: "Active", value: activeCount },
    { name: "Pending", value: pendingCount },
    { name: "Returned", value: returnedCount },
    { name: "Overdue", value: overdueCount },
  ].filter((x) => x.value > 0);

  const exportCsv = () => {
    const rows = [["Equipment", "Category", "Total units", "Available", "Rented", "Condition", "Location"], ...equipment.map((e) => [e.name, e.category, e.totalQuantity, availableQuantity(e, rentals), e.totalQuantity - availableQuantity(e, rentals), e.condition, e.location])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "rentalinventory-report.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    <PageHeader title="Reports & Analytics" description="Understand inventory utilization and rental activity." actions={<Button onClick={exportCsv} variant="outline"><Download className="mr-2 size-4"/>Export inventory CSV</Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total inventory" value={totalUnits} icon={Boxes} hint={`${equipment.length} equipment types`} />
      <StatCard label="Units in use" value={rentedUnits} icon={PackageCheck} tone="brand" hint={`${totalUnits ? Math.round(rentedUnits / totalUnits * 100) : 0}% utilization`} />
      <StatCard label="Active rentals" value={activeCount} icon={CalendarDays} tone="success" hint={`${pendingCount} pending requests`} />
      <StatCard label="Overdue rentals" value={overdueCount} icon={TrendingUp} tone="danger" hint="Requires follow-up" />
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Inventory by category" description="Total units and currently available units">
        <div className="h-80 p-4">
          {categoryData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="category" tick={{ fontSize: 12 }}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="total" name="Total units" fill="#4263eb" radius={[4,4,0,0]}/><Bar dataKey="available" name="Available" fill="#10b981" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer> : <p className="p-8 text-sm text-muted-foreground">No inventory data yet.</p>}
        </div>
      </Panel>
      <Panel title="Rental status breakdown" description="All rental records by current status">
        <div className="flex h-80 items-center justify-center gap-5 p-4">
          {statusData.length ? <><ResponsiveContainer width="65%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={3}>{statusData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="space-y-3">{statusData.map((entry, i) => <div key={entry.name} className="flex items-center gap-2 text-sm"><span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}/><span>{entry.name}</span><strong className="ml-auto">{entry.value}</strong></div>)}</div></> : <p className="text-sm text-muted-foreground">No rentals yet.</p>}
        </div>
      </Panel>
    </div>
    <Panel title="Category summary" description="Current availability by equipment category">
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/40 text-left text-muted-foreground"><th className="px-5 py-3 font-medium">Category</th><th className="px-5 py-3 font-medium">Total units</th><th className="px-5 py-3 font-medium">Available</th><th className="px-5 py-3 font-medium">Rented</th><th className="px-5 py-3 font-medium">Availability</th></tr></thead><tbody>{categoryData.map((row) => <tr key={row.category} className="border-b last:border-0"><td className="px-5 py-3 font-medium">{row.category}</td><td className="px-5 py-3">{row.total}</td><td className="px-5 py-3">{row.available}</td><td className="px-5 py-3">{row.total-row.available}</td><td className="px-5 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{width:`${row.total ? row.available/row.total*100 : 0}%`}}/></div><span className="text-xs text-muted-foreground">{row.total ? Math.round(row.available/row.total*100) : 0}%</span></div></td></tr>)}</tbody></table></div>
    </Panel>
  </div>;
}
