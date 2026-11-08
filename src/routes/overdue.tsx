import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Mail, ShieldCheck, Timer, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EquipmentThumb, Panel, PageHeader, StatCard, StatusBadge, EmptyState, tableCls } from "@/components/app/ui-bits";
import { ReturnDialog } from "@/components/app/return-dialog";
import { useInventory } from "@/lib/inventory-store";
import { formatDate, isOverdue, overdueDays, todayISO } from "@/lib/rental-utils";
import type { Rental } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/overdue")({
  head: () => ({
    meta: [
      { title: "Overdue items · RentalInventory" },
      { name: "description", content: "Automatically flagged rentals that are past their expected return date." },
      { property: "og:title", content: "Overdue items · RentalInventory" },
      { property: "og:description", content: "Rentals past their expected return date." },
    ],
  }),
  component: OverduePage,
});

const severity = (d: number) => (d >= 7 ? "Critical" : d >= 3 ? "High" : "Moderate");

function OverduePage() {
  const { rentals, getEquipment } = useInventory();
  const [returning, setReturning] = useState<Rental | null>(null);
  const today = todayISO();
  const overdue = rentals.filter((r) => isOverdue(r, today)).sort((a, b) => overdueDays(b, today) - overdueDays(a, today));
  const avg = overdue.length ? Math.round(overdue.reduce((s, r) => s + overdueDays(r, today), 0) / overdue.length) : 0;
  const borrowers = new Set(overdue.map((r) => r.borrowerName)).size;

  return (
    <>
      <PageHeader title="Overdue items" description="Active rentals whose expected return date has passed — flagged automatically." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Overdue rentals" value={overdue.length} icon={AlertTriangle} tone={overdue.length ? "danger" : "default"} hint={`${overdue.reduce((s, r) => s + r.quantity, 0)} units outstanding`} />
        <StatCard label="Average delay" value={`${avg}d`} icon={Timer} />
        <StatCard label="Borrowers to contact" value={borrowers} icon={Users} />
      </div>

      <Panel title="Overdue tracker" description="Longest delay first" className="mt-6">
        {overdue.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <ShieldCheck className="size-10 text-success" />
            <p className="mt-3 font-medium">Everything is on time</p>
            <p className="text-sm text-muted-foreground">No active rentals are past their return date.</p>
          </div>
        ) : (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead><tr>
                <th className={tableCls.th}>Borrower</th><th className={tableCls.th}>Equipment</th><th className={tableCls.th}>Expected return</th>
                <th className={tableCls.th}>Days overdue</th><th className={tableCls.th}>Status</th><th className={tableCls.th} />
              </tr></thead>
              <tbody>
                {overdue.map((r) => {
                  const e = getEquipment(r.equipmentId);
                  const d = overdueDays(r, today);
                  const sev = severity(d);
                  return (
                    <tr key={r.id} className={cn(tableCls.tr, "border-l-2", sev === "Critical" ? "border-l-destructive" : sev === "High" ? "border-l-warning" : "border-l-transparent")}>
                      <td className={tableCls.td}><p className="font-medium">{r.borrowerName}</p><p className="text-xs text-muted-foreground">{r.borrowerContact}</p></td>
                      <td className={tableCls.td}>
                        <div className="flex items-center gap-2.5">
                          {e && <EquipmentThumb category={e.category} imageUrl={e.imageUrl} size="sm" />}
                          <div><p>{e?.name ?? "Deleted item"}</p><p className="text-xs text-muted-foreground">{r.quantity} unit{r.quantity > 1 ? "s" : ""} · {r.id}</p></div>
                        </div>
                      </td>
                      <td className={`${tableCls.td} whitespace-nowrap`}>{formatDate(r.expectedReturnDate)}</td>
                      <td className={tableCls.td}>
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold tabular",
                          sev === "Critical" ? "bg-destructive text-destructive-foreground" : sev === "High" ? "bg-warning-soft text-warning" : "bg-destructive-soft text-destructive")}>
                          {d} day{d > 1 ? "s" : ""} · {sev}
                        </span>
                      </td>
                      <td className={tableCls.td}><StatusBadge status="overdue" /></td>
                      <td className={tableCls.td}>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => toast.success("Reminder queued", { description: `Will be sent to ${r.borrowerContact} once messaging is connected.` })}><Mail /> Remind</Button>
                          <Button size="sm" variant="outline" onClick={() => setReturning(r)}>Mark returned</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {overdue.length === 0 && <EmptyState title="" description="" />}
      <ReturnDialog rental={returning} onOpenChange={(o) => !o && setReturning(null)} />
    </>
  );
}
