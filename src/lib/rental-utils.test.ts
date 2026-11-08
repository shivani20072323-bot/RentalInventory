import { describe, expect, it } from "vitest";
import { availableQuantity, isOverdue, overdueDays } from "./rental-utils";
import type { Equipment, Rental } from "./types";

const base: Rental = {
  id: "RN-1", equipmentId: "EQ-1", borrowerName: "A", borrowerContact: "a@x", quantity: 2,
  startDate: "2026-10-01", expectedReturnDate: "2026-11-01", status: "active", createdAt: "",
};

describe("overdue rule", () => {
  it("active rental past its return date is overdue", () => {
    expect(isOverdue(base, "2026-11-05")).toBe(true);
    expect(overdueDays(base, "2026-11-05")).toBe(4);
  });
  it("returned rental is never overdue", () => {
    expect(isOverdue({ ...base, status: "returned" }, "2026-11-05")).toBe(false);
  });
  it("due today is not overdue", () => {
    expect(isOverdue(base, "2026-11-01")).toBe(false);
  });
});

describe("availability", () => {
  it("subtracts only active rentals", () => {
    const eq = { id: "EQ-1", totalQuantity: 5 } as Equipment;
    expect(availableQuantity(eq, [base, { ...base, id: "RN-2", status: "returned" }])).toBe(3);
  });
});
