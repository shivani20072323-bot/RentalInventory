import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "./form-field";
import { useInventory } from "@/lib/inventory-store";
import { rentedQuantity } from "@/lib/rental-utils";
import { CATEGORIES, CONDITIONS, type Category, type Condition, type Equipment } from "@/lib/types";

type FormState = { id: string; name: string; category: Category | ""; description: string; totalQuantity: string; condition: Condition; location: string; imageUrl: string };

const empty: FormState = { id: "", name: "", category: "", description: "", totalQuantity: "1", condition: "Good", location: "", imageUrl: "" };

export function EquipmentFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Equipment | null }) {
  const { equipment, rentals, addEquipment, updateEquipment } = useInventory();
  const [f, setF] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      setF({ ...editing, totalQuantity: String(editing.totalQuantity), imageUrl: editing.imageUrl ?? "" });
    } else {
      const next = equipment.reduce((m, e) => Math.max(m, Number(e.id.split("-")[1]) || 0), 1000) + 1;
      setF({ ...empty, id: `EQ-${next}` });
    }
  }, [open, editing, equipment]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!f.name.trim()) err.name = "Equipment name is required";
    if (!/^[A-Z]{2,4}-\d{3,6}$/.test(f.id.trim())) err.id = "Use a format like EQ-1013";
    else if (!editing && equipment.some((x) => x.id === f.id.trim())) err.id = "This ID is already in use";
    if (!f.category) err.category = "Choose a category";
    if (!f.location.trim()) err.location = "Location is required";
    const qty = Number(f.totalQuantity);
    if (!Number.isInteger(qty) || qty < 1) err.totalQuantity = "Enter a whole number of at least 1";
    else if (editing && qty < rentedQuantity(editing.id, rentals))
      err.totalQuantity = `${rentedQuantity(editing.id, rentals)} unit(s) are currently rented out`;
    if (f.imageUrl && !/^https?:\/\//.test(f.imageUrl)) err.imageUrl = "Must be an http(s) link";
    setErrors(err);
    if (Object.keys(err).length) return;

    const payload = {
      id: f.id.trim(), name: f.name.trim(), category: f.category as Category, description: f.description.trim(),
      totalQuantity: qty, condition: f.condition, location: f.location.trim(), imageUrl: f.imageUrl.trim() || undefined,
    };
    try {
      if (editing) {
        await updateEquipment(editing.id, payload);
        toast.success("Equipment updated", { description: payload.name });
      } else {
        await addEquipment(payload);
        toast.success("Equipment added", { description: `${payload.name} · ${payload.id}` });
      }
      onOpenChange(false);
    } catch (error) { toast.error("Couldn't save equipment", { description: error instanceof Error ? error.message : "Please try again" }); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit equipment" : "Add equipment"}</DialogTitle>
          <DialogDescription>{editing ? "Update the details of this item." : "Register a new item in the inventory."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Equipment name" htmlFor="eq-name" required error={errors.name} className="sm:col-span-2">
            <Input id="eq-name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Canon EOS R6" aria-invalid={!!errors.name} />
          </Field>
          <Field label="Equipment ID" htmlFor="eq-id" required error={errors.id}>
            <Input id="eq-id" value={f.id} disabled={!!editing} onChange={(e) => set("id", e.target.value.toUpperCase())} className="font-mono" />
          </Field>
          <Field label="Category" htmlFor="eq-cat" required error={errors.category}>
            <Select value={f.category} onValueChange={(v) => set("category", v as Category)}>
              <SelectTrigger id="eq-cat" className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Total quantity" htmlFor="eq-qty" required error={errors.totalQuantity}>
            <Input id="eq-qty" type="number" min={1} value={f.totalQuantity} onChange={(e) => set("totalQuantity", e.target.value)} />
          </Field>
          <Field label="Condition" htmlFor="eq-cond">
            <Select value={f.condition} onValueChange={(v) => set("condition", v as Condition)}>
              <SelectTrigger id="eq-cond" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Location" htmlFor="eq-loc" required error={errors.location}>
            <Input id="eq-loc" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Media Room B2" />
          </Field>
          <Field label="Image URL" htmlFor="eq-img" error={errors.imageUrl}>
            <Input id="eq-img" value={f.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Description" htmlFor="eq-desc" className="sm:col-span-2">
            <Textarea id="eq-desc" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Accessories, usage notes…" />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Save changes" : "Add equipment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
