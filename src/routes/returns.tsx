import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, PackageOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EquipmentThumb, Panel, PageHeader, StatCard, StatusBadge, EmptyState, tableCls } from "@/components/app/ui-bits";
import { ReturnDialog } from "@/components/app/return-dialog";
import { useInventory } from "@/lib/inventory-store";
import { addDays, daysBetween, displayStatus, formatDate, todayISO } from "@/lib/rental-utils";
import type { Rental } from "@/lib/types";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns · RentalInventory" },
      { name: "description", content: "Process equipment returns, record condition and restore availability." },
      { property: "og:title", content: "Returns · RentalInventory" },
      { property: "og:description", content: "Process equipment returns and record condition." },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const { rentals, getEquipment } = useInventory();
  const [returning, setReturning] = useState<Rental | null>(null);
  const today = todayISO();
  const active = rentals.filter((r) => r.status === "active").sort((a, b) => a.expectedReturnDate.localeCompare(b.expectedReturnDate));
  const dueSoon = active.filter((r) => r.expectedReturnDate >= today && r.expectedReturnDate <= addDays(today, 3));
  const returned = rentals.filter((r) => r.status === "returned").sort((a, b) => (b.actualReturnDate ?? "").localeCompare(a.actualReturnDate ?? "")).slice(0, 8);

  const dueLabel = (r: Rental) => {
    const d = daysBetween(today, r.expectedReturnDate);
    return d < 0 ? `${-d}d overdue` : d === 0 ? "Due today" : `Due in ${d}d`;
  };

  return (
    <>
      <PageHeader title="Returns" description="Check equipment back in and keep availability accurate." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active rentals" value={active.length} icon={PackageOpen} tone="brand" />
        <StatCard label="Due within 3 days" value={dueSoon.length} icon={CalendarClock} />
        <StatCard label="Returned (all time)" value={rentals.filter((r) => r.status === "returned").length} icon={CheckCircle2} tone="success" />
      </div>

      <Panel title="Awaiting return" description="Sorted by expected return date" className="mt-6">
        {active.length === 0 ? <EmptyState title="Nothing out right now" description="Active rentals will be listed here for check-in." /> : (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead><tr>
                <th className={tableCls.th}>Equipment</th><th className={tableCls.th}>Borrower</th><th className={tableCls.th}>Qty</th>
                <th className={tableCls.th}>Expected return</th><th className={tableCls.th}>Status</th><th className={tableCls.th} />
              </tr></thead>
              <tbody>
                {active.map((r) => {
                  const e = getEquipment(r.equipmentId);
                  const s = displayStatus(r, today);
                  return (
                    <tr key={r.id} className={tableCls.tr}>
                      <td className={tableCls.td}>
                        <div className="flex items-center gap-2.5">
                          {e && <EquipmentThumb category={e.category} imageUrl={e.imageUrl} size="sm" />}
                          <div><p className="font-medium">{e?.name ?? "Deleted item"}</p><p className="font-mono text-xs text-muted-foreground">{r.id}</p></div>
                        </div>
                      </td>
                      <td className={tableCls.td}><p>{r.borrowerName}</p><p className="text-xs text-muted-foreground">{r.borrowerContact}</p></td>
                      <td className={`${tableCls.td} tabular`}>{r.quantity}</td>
                      <td className={`${tableCls.td} whitespace-nowrap`}>
                        <p>{formatDate(r.expectedReturnDate)}</p>
                        <p className={s === "overdue" ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"}>{dueLabel(r)}</p>
                      </td>
                      <td className={tableCls.td}><StatusBadge status={s} /></td>
                      <td className={`${tableCls.td} text-right`}><Button size="sm" onClick={() => setReturning(r)}>Mark returned</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Recently returned" className="mt-6">
        {returned.length === 0 ? <EmptyState title="No returns yet" description="Completed returns will show here." /> : (
          <ul className="divide-y">
            {returned.map((r) => {
              const late = r.actualReturnDate && r.actualReturnDate > r.expectedReturnDate;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <CheckCircle2 className="size-4 text-success" />
                  <span className="font-medium">{getEquipment(r.equipmentId)?.name ?? "Deleted item"}</span>
                  <span className="text-muted-foreground">from {r.borrowerName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(r.actualReturnDate)} · {r.returnCondition}{late && <span className="ml-1 font-medium text-warning">· late</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <ReturnDialog rental={returning} onOpenChange={(o) => !o && setReturning(null)} />
    </>
  );
}
