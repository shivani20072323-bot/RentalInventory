import type { Equipment, Rental } from "./types";

export const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const todayISO = () => toISODate(new Date());

export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

export const daysBetween = (fromISO: string, toISO: string) =>
  Math.round(
    (new Date(toISO + "T00:00:00").getTime() - new Date(fromISO + "T00:00:00").getTime()) / 86400000,
  );

/** A rental is overdue when it is still active and its expected return date has passed. */
export const isOverdue = (r: Rental, today = todayISO()) =>
  r.status === "active" && r.expectedReturnDate < today;

export const overdueDays = (r: Rental, today = todayISO()) =>
  isOverdue(r, today) ? daysBetween(r.expectedReturnDate, today) : 0;

/** Units out = sum of quantities on active rentals for that item. */
export const rentedQuantity = (equipmentId: string, rentals: Rental[]) =>
  rentals
    .filter((r) => r.equipmentId === equipmentId && r.status === "active")
    .reduce((s, r) => s + r.quantity, 0);

export const availableQuantity = (eq: Equipment, rentals: Rental[]) =>
  Math.max(0, eq.totalQuantity - rentedQuantity(eq.id, rentals));

export type DisplayStatus = "pending" | "active" | "overdue" | "returned" | "rejected";
export const displayStatus = (r: Rental, today = todayISO()): DisplayStatus =>
  isOverdue(r, today) ? "overdue" : r.status;

export const formatDate = (iso?: string) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
