import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EquipmentThumb, Panel, PageHeader, StatusBadge, EmptyState, tableCls } from "@/components/app/ui-bits";
import { RentalFormDialog } from "@/components/app/rental-form-dialog";
import { ReturnDialog } from "@/components/app/return-dialog";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { useInventory } from "@/lib/inventory-store";
import { displayStatus, formatDate, todayISO, type DisplayStatus } from "@/lib/rental-utils";
import type { Rental } from "@/lib/types";

export const Route = createFileRoute("/rentals")({
  head: () => ({
    meta: [
      { title: "Rentals · RentalInventory" },
      { name: "description", content: "Create rental requests, approve or reject them and track active checkouts." },
      { property: "og:title", content: "Rentals · RentalInventory" },
      { property: "og:description", content: "Create, approve and track equipment rentals." },
    ],
  }),
  component: RentalsPage,
});

const tabs: { value: "all" | DisplayStatus; label: string }[] = [
  { value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" }, { value: "returned", label: "Returned" }, { value: "rejected", label: "Rejected" },
];

function RentalsPage() {
  const { rentals, getEquipment, approveRental, rejectRental } = useInventory();
  const [tab, setTab] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Rental | null>(null);
  const [rejecting, setRejecting] = useState<Rental | null>(null);
  const [returning, setReturning] = useState<Rental | null>(null);
  const today = todayISO();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rentals.length };
    rentals.forEach((r) => { const s = displayStatus(r, today); c[s] = (c[s] ?? 0) + 1; });
    return c;
  }, [rentals, today]);

  const rows = rentals
    .filter((r) => tab === "all" || displayStatus(r, today) === tab)
    .filter((r) => !q || `${r.id} ${r.borrowerName} ${getEquipment(r.equipmentId)?.name ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.id.localeCompare(a.id));

  const approve = async (r: Rental) => {
    const res = await approveRental(r.id);
    if (res.ok) toast.success("Rental approved", { description: `${r.id} is now active` });
    else toast.error("Couldn't approve", { description: res.reason });
    setDetail(null);
  };

  const rowActions = (r: Rental) => {
    const s = displayStatus(r, today);
    if (r.status === "pending") return (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setRejecting(r); }}><X /> Reject</Button>
        <Button size="sm" onClick={(e) => { e.stopPropagation(); void approve(r); }}><Check /> Approve</Button>
      </div>
    );
    if (s === "active" || s === "overdue") return (
      <div className="flex justify-end"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setReturning(r); }}>Mark returned</Button></div>
    );
    return null;
  };

  return (
    <>
      <PageHeader title="Rentals" description="Manage rental requests and track equipment that's out."
        actions={<Button onClick={() => setOpen(true)}><Plus /> New rental</Button>} />
      <Panel>
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={tab} onValueChange={setTab} className="overflow-x-auto">
            <TabsList>
              {tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label} <span className="ml-1 text-xs text-muted-foreground tabular">{counts[t.value] ?? 0}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative lg:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, borrower, equipment" className="pl-8" />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="No rentals found" description="Nothing matches this view. Try another tab or search." />
        ) : (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead><tr>
                <th className={tableCls.th}>Rental ID</th><th className={tableCls.th}>Equipment</th><th className={tableCls.th}>Borrower</th>
                <th className={tableCls.th}>Qty</th><th className={tableCls.th}>Start</th><th className={tableCls.th}>Expected return</th>
                <th className={tableCls.th}>Status</th><th className={tableCls.th} />
              </tr></thead>
              <tbody>
                {rows.map((r) => {
                  const e = getEquipment(r.equipmentId);
                  return (
                    <tr key={r.id} className={`${tableCls.tr} cursor-pointer`} onClick={() => setDetail(r)}>
                      <td className={`${tableCls.td} font-mono text-xs`}>{r.id}</td>
                      <td className={tableCls.td}>
                        <div className="flex items-center gap-2.5">
                          {e && <EquipmentThumb category={e.category} imageUrl={e.imageUrl} size="sm" />}
                          <span className="font-medium">{e?.name ?? "Deleted item"}</span>
                        </div>
                      </td>
                      <td className={tableCls.td}>{r.borrowerName}</td>
                      <td className={`${tableCls.td} tabular`}>{r.quantity}</td>
                      <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>{formatDate(r.startDate)}</td>
                      <td className={`${tableCls.td} whitespace-nowrap text-muted-foreground`}>{formatDate(r.expectedReturnDate)}</td>
                      <td className={tableCls.td}><StatusBadge status={displayStatus(r, today)} /></td>
                      <td className={tableCls.td}>{rowActions(r)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><span className="font-mono">{detail.id}</span> <StatusBadge status={displayStatus(detail, today)} /></SheetTitle>
                <SheetDescription>{getEquipment(detail.equipmentId)?.name ?? "Deleted item"}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4">
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border text-sm">
                  {[["Borrower", detail.borrowerName], ["Contact", detail.borrowerContact], ["Quantity", detail.quantity], ["Requested", formatDate(detail.createdAt)],
                    ["Start", formatDate(detail.startDate)], ["Expected return", formatDate(detail.expectedReturnDate)],
                    ...(detail.actualReturnDate ? [["Returned on", formatDate(detail.actualReturnDate)], ["Return condition", detail.returnCondition ?? "—"]] : [])].map(([k, v]) => (
                    <div key={k as string} className="bg-card p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 break-words font-medium">{v}</dd></div>
                  ))}
                </dl>
                {(detail.notes || detail.returnNotes) && (
                  <div className="space-y-2 text-sm">
                    {detail.notes && <p><span className="text-muted-foreground">Notes: </span>{detail.notes}</p>}
                    {detail.returnNotes && <p><span className="text-muted-foreground">Return notes: </span>{detail.returnNotes}</p>}
                  </div>
                )}
                {rowActions(detail)}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <RentalFormDialog open={open} onOpenChange={setOpen} />
      <ReturnDialog rental={returning} onOpenChange={(o) => { if (!o) { setReturning(null); setDetail(null); } }} />
      <ConfirmDialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)} destructive confirmLabel="Reject request"
        title={`Reject ${rejecting?.id}?`} description={`The request from ${rejecting?.borrowerName} will be declined.`}
        onConfirm={() => {
          if (rejecting) void rejectRental(rejecting.id).then(() => toast("Rental rejected", { description: rejecting.id })).catch((error) => toast.error("Couldn't reject rental", { description: error instanceof Error ? error.message : "Please try again" }));
          setRejecting(null); setDetail(null);
        }} />
    </>
  );
}
