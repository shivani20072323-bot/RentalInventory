import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, LayoutGrid, List, MoreHorizontal, Pencil, Plus, Search, Trash2, ArrowLeftRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { EquipmentThumb, Panel, PageHeader, StatusBadge, EmptyState, availabilityStatus, tableCls } from "@/components/app/ui-bits";
import { EquipmentFormDialog } from "@/components/app/equipment-form-dialog";
import { RentalFormDialog } from "@/components/app/rental-form-dialog";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { useInventory } from "@/lib/inventory-store";
import { availableQuantity, displayStatus, formatDate, rentedQuantity } from "@/lib/rental-utils";
import { CATEGORIES, type Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/equipment")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () => ({
    meta: [
      { title: "Equipment catalogue · RentalInventory" },
      { name: "description", content: "Browse, search and manage every item in your equipment inventory." },
      { property: "og:title", content: "Equipment catalogue · RentalInventory" },
      { property: "og:description", content: "Browse, search and manage every item in your equipment inventory." },
    ],
  }),
  component: EquipmentPage,
});

type Sort = "name" | "available" | "total" | "newest";

function EquipmentPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/equipment" });
  const { equipment, rentals, deleteEquipment } = useInventory();
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState<Sort>("name");
  const [view, setView] = useState<"table" | "grid">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState<Equipment | null>(null);
  const [viewing, setViewing] = useState<Equipment | null>(null);
  const [rentFor, setRentFor] = useState<string | undefined>();
  const [rentOpen, setRentOpen] = useState(false);

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    return equipment
      .map((e) => ({ e, avail: availableQuantity(e, rentals) }))
      .filter(({ e }) => !needle || `${e.name} ${e.id} ${e.location}`.toLowerCase().includes(needle))
      .filter(({ e }) => category === "all" || e.category === category)
      .filter(({ e, avail }) => availability === "all" || availabilityStatus(avail, e.totalQuantity) === availability)
      .sort((a, b) =>
        sort === "available" ? b.avail - a.avail : sort === "total" ? b.e.totalQuantity - a.e.totalQuantity
        : sort === "newest" ? b.e.createdAt.localeCompare(a.e.createdAt) : a.e.name.localeCompare(b.e.name));
  }, [equipment, rentals, q, category, availability, sort]);

  const filtersActive = q || category !== "all" || availability !== "all";
  const clear = () => { navigate({ search: {} }); setCategory("all"); setAvailability("all"); };

  const actions = (e: Equipment) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${e.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setViewing(e)}><Eye /> View details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setEditing(e); setFormOpen(true); }}><Pencil /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setRentFor(e.id); setRentOpen(true); }}><ArrowLeftRight /> New rental</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(e)}><Trash2 /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const viewingRentals = viewing ? rentals.filter((r) => r.equipmentId === viewing.id).slice(0, 6) : [];

  return (
    <>
      <PageHeader title="Equipment" description={`${equipment.length} items · ${equipment.reduce((s, e) => s + e.totalQuantity, 0)} units in inventory`}
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> Add equipment</Button>} />

      <Panel>
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => navigate({ search: { q: e.target.value || undefined }, replace: true })} placeholder="Search by name, ID or location" className="pl-8" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any availability</SelectItem><SelectItem value="available">Available</SelectItem>
                <SelectItem value="low">Low stock</SelectItem><SelectItem value="out">Unavailable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort: Name</SelectItem><SelectItem value="available">Sort: Most available</SelectItem>
                <SelectItem value="total">Sort: Total quantity</SelectItem><SelectItem value="newest">Sort: Newest</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-md border p-0.5">
              {(["table", "grid"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} aria-label={`${v} view`} className={cn("grid size-8 place-items-center rounded-sm text-muted-foreground transition-colors", view === v && "bg-muted text-foreground")}>
                  {v === "table" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title={filtersActive ? "No equipment matches" : "No equipment yet"}
            description={filtersActive ? "Try adjusting your search or filters." : "Add your first item to start tracking rentals."}
            action={filtersActive ? <Button variant="outline" onClick={clear}>Clear filters</Button> : <Button onClick={() => setFormOpen(true)}><Plus /> Add equipment</Button>} />
        ) : view === "table" ? (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <thead><tr>
                <th className={tableCls.th}>Equipment</th><th className={tableCls.th}>Category</th><th className={tableCls.th}>Total</th>
                <th className={tableCls.th}>Available</th><th className={tableCls.th}>Status</th><th className={tableCls.th} />
              </tr></thead>
              <tbody>
                {rows.map(({ e, avail }) => (
                  <tr key={e.id} className={tableCls.tr}>
                    <td className={tableCls.td}>
                      <button className="flex items-center gap-3 text-left" onClick={() => setViewing(e)}>
                        <EquipmentThumb category={e.category} imageUrl={e.imageUrl} />
                        <div><p className="font-medium hover:underline">{e.name}</p><p className="font-mono text-xs text-muted-foreground">{e.id}</p></div>
                      </button>
                    </td>
                    <td className={`${tableCls.td} text-muted-foreground`}>{e.category}</td>
                    <td className={`${tableCls.td} tabular`}>{e.totalQuantity}</td>
                    <td className={tableCls.td}>
                      <div className="flex w-28 items-center gap-2">
                        <span className="w-5 font-medium tabular">{avail}</span>
                        <Progress value={(avail / e.totalQuantity) * 100} className="h-1.5" />
                      </div>
                    </td>
                    <td className={tableCls.td}><StatusBadge status={availabilityStatus(avail, e.totalQuantity)} /></td>
                    <td className={`${tableCls.td} text-right`}>{actions(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ e, avail }) => (
              <div key={e.id} className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-pop">
                <div className="flex items-start justify-between">
                  <EquipmentThumb category={e.category} imageUrl={e.imageUrl} size="lg" />
                  {actions(e)}
                </div>
                <button onClick={() => setViewing(e)} className="mt-3 block text-left">
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-mono">{e.id}</span> · {e.category}</p>
                </button>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground"><span className="font-medium text-foreground tabular">{avail}</span> / {e.totalQuantity} available</span>
                  <StatusBadge status={availabilityStatus(avail, e.totalQuantity)} />
                </div>
                <Progress value={(avail / e.totalQuantity) * 100} className="mt-2 h-1.5" />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {viewing && (() => {
            const avail = availableQuantity(viewing, rentals);
            return (
              <>
                <SheetHeader>
                  <EquipmentThumb category={viewing.category} imageUrl={viewing.imageUrl} size="lg" />
                  <SheetTitle className="mt-2">{viewing.name}</SheetTitle>
                  <SheetDescription><span className="font-mono">{viewing.id}</span> · {viewing.category}</SheetDescription>
                </SheetHeader>
                <div className="space-y-6 px-4 pb-6">
                  <p className="text-sm text-muted-foreground">{viewing.description || "No description."}</p>
                  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border text-sm">
                    {[["Total", viewing.totalQuantity], ["Available", avail], ["Rented out", rentedQuantity(viewing.id, rentals)], ["Condition", viewing.condition], ["Location", viewing.location], ["Added", formatDate(viewing.createdAt)]].map(([k, v]) => (
                      <div key={k as string} className="bg-card p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
                    ))}
                  </dl>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Rental history</p>
                    {viewingRentals.length === 0 ? <p className="text-sm text-muted-foreground">Never rented.</p> : (
                      <ul className="divide-y rounded-lg border">
                        {viewingRentals.map((r) => (
                          <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <div><p className="font-medium">{r.borrowerName}</p><p className="text-xs text-muted-foreground">{formatDate(r.startDate)} → {formatDate(r.expectedReturnDate)}</p></div>
                            <StatusBadge status={displayStatus(r)} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={avail === 0} onClick={() => { setRentFor(viewing.id); setRentOpen(true); }}><ArrowLeftRight /> New rental</Button>
                    <Button variant="outline" onClick={() => { setEditing(viewing); setFormOpen(true); }}><Pencil /> Edit</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <EquipmentFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <RentalFormDialog open={rentOpen} onOpenChange={setRentOpen} presetEquipmentId={rentFor} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} destructive confirmLabel="Delete equipment"
        title={`Delete ${deleting?.name}?`}
        description={deleting && rentedQuantity(deleting.id, rentals) > 0
          ? `${rentedQuantity(deleting.id, rentals)} unit(s) are currently rented out. Deleting removes the item from the catalogue permanently.`
          : "This permanently removes the item from your catalogue. This can't be undone."}
        onConfirm={() => {
          if (!deleting) return;
          const item = deleting;
          void deleteEquipment(item.id).then(() => {
            if (viewing?.id === item.id) setViewing(null);
            toast.success("Equipment deleted", { description: item.name });
          }).catch((error) => toast.error("Couldn't delete equipment", { description: error instanceof Error ? error.message : "Please try again" }));
          setDeleting(null);
        }} />
    </>
  );
}
