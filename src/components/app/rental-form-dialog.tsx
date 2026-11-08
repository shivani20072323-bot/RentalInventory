import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "./form-field";
import { useInventory } from "@/lib/inventory-store";
import { addDays, availableQuantity, todayISO } from "@/lib/rental-utils";

const blank = () => ({ equipmentId: "", borrowerName: "", borrowerContact: "", quantity: "1", startDate: todayISO(), expectedReturnDate: addDays(todayISO(), 3), notes: "" });

export function RentalFormDialog({ open, onOpenChange, presetEquipmentId }: { open: boolean; onOpenChange: (o: boolean) => void; presetEquipmentId?: string }) {
  const { equipment, rentals, createRental } = useInventory();
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState<Partial<Record<"equipmentId" | "borrowerName" | "borrowerContact" | "quantity" | "startDate" | "expectedReturnDate", string>>>({});

  useEffect(() => {
    if (open) { setF({ ...blank(), equipmentId: presetEquipmentId ?? "" }); setErrors({}); }
  }, [open, presetEquipmentId]);

  const selected = equipment.find((e) => e.id === f.equipmentId);
  const avail = selected ? availableQuantity(selected, rentals) : 0;
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!selected) err.equipmentId = "Select equipment";
    if (!f.borrowerName.trim()) err.borrowerName = "Borrower name is required";
    if (!f.borrowerContact.trim()) err.borrowerContact = "Email or phone is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.borrowerContact.trim()) && !/^\+?[\d\s-]{7,}$/.test(f.borrowerContact.trim()))
      err.borrowerContact = "Enter a valid email or phone number";
    const qty = Number(f.quantity);
    if (!Number.isInteger(qty) || qty < 1) err.quantity = "At least 1";
    else if (selected && qty > avail) err.quantity = `Only ${avail} available`;
    if (!f.startDate) err.startDate = "Required";
    if (!f.expectedReturnDate) err.expectedReturnDate = "Required";
    else if (f.expectedReturnDate < f.startDate) err.expectedReturnDate = "Must be on or after start date";
    setErrors(err);
    if (Object.keys(err).length) return;
    try {
      const id = await createRental({
        equipmentId: f.equipmentId, borrowerName: f.borrowerName.trim(), borrowerContact: f.borrowerContact.trim(),
        quantity: qty, startDate: f.startDate, expectedReturnDate: f.expectedReturnDate, notes: f.notes.trim() || undefined,
      });
      toast.success("Rental request created", { description: `${id} is awaiting approval` });
      onOpenChange(false);
    } catch (error) { toast.error("Couldn't create rental", { description: error instanceof Error ? error.message : "Please try again" }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New rental request</DialogTitle>
          <DialogDescription>Requests start as pending until approved.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Equipment" htmlFor="rn-eq" required error={errors.equipmentId} className="sm:col-span-2">
            <Select value={f.equipmentId} onValueChange={(v) => set("equipmentId", v)}>
              <SelectTrigger id="rn-eq" className="w-full"><SelectValue placeholder="Select equipment" /></SelectTrigger>
              <SelectContent>
                {equipment.map((e) => {
                  const a = availableQuantity(e, rentals);
                  return (
                    <SelectItem key={e.id} value={e.id} disabled={a === 0}>
                      {e.name} <span className="text-muted-foreground">· {a} available</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Borrower name" htmlFor="rn-name" required error={errors.borrowerName}>
            <Input id="rn-name" value={f.borrowerName} onChange={(e) => set("borrowerName", e.target.value)} placeholder="Person or club" />
          </Field>
          <Field label="Contact" htmlFor="rn-contact" required error={errors.borrowerContact}>
            <Input id="rn-contact" value={f.borrowerContact} onChange={(e) => set("borrowerContact", e.target.value)} placeholder="Email or phone" />
          </Field>
          <Field label="Quantity" htmlFor="rn-qty" required error={errors.quantity}>
            <Input id="rn-qty" type="number" min={1} max={avail || undefined} value={f.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </Field>
          <div className="hidden sm:block" />
          <Field label="Start date" htmlFor="rn-start" required error={errors.startDate}>
            <Input id="rn-start" type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Expected return" htmlFor="rn-end" required error={errors.expectedReturnDate}>
            <Input id="rn-end" type="date" value={f.expectedReturnDate} min={f.startDate} onChange={(e) => set("expectedReturnDate", e.target.value)} />
          </Field>
          <Field label="Notes" htmlFor="rn-notes" className="sm:col-span-2">
            <Textarea id="rn-notes" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Purpose, event, special handling…" />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
