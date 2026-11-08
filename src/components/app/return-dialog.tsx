import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "./form-field";
import { useInventory } from "@/lib/inventory-store";
import { todayISO } from "@/lib/rental-utils";
import { CONDITIONS, type Condition, type Rental } from "@/lib/types";

export function ReturnDialog({ rental, onOpenChange }: { rental: Rental | null; onOpenChange: (o: boolean) => void }) {
  const { returnRental, getEquipment } = useInventory();
  const [date, setDate] = useState(todayISO());
  const [condition, setCondition] = useState<Condition>("Good");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (rental) { setDate(todayISO()); setCondition("Good"); setNotes(""); setError(""); }
  }, [rental]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental) return;
    if (!date) return setError("Return date is required");
    if (date < rental.startDate) return setError("Cannot be before the rental start date");
    try {
      await returnRental(rental.id, { actualReturnDate: date, returnCondition: condition, ...(notes.trim() ? { returnNotes: notes.trim() } : {}) });
      toast.success("Return recorded", { description: `${rental.quantity} × ${getEquipment(rental.equipmentId)?.name} back in stock` });
      onOpenChange(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again"); }
  };

  return (
    <Dialog open={!!rental} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as returned</DialogTitle>
          <DialogDescription>
            {rental && `${rental.id} · ${rental.quantity} × ${getEquipment(rental.equipmentId)?.name ?? "Unknown"} from ${rental.borrowerName}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <Field label="Actual return date" htmlFor="rt-date" required error={error}>
            <Input id="rt-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Condition on return" htmlFor="rt-cond">
            <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
              <SelectTrigger id="rt-cond" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Return notes" htmlFor="rt-notes">
            <Textarea id="rt-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Missing parts, damage, cleaning needed…" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Confirm return</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
