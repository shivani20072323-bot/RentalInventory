import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

const equipmentResponse = {
  _id: "eq-1",
  name: "Camera",
  category: "Camera",
  description: "",
  totalQuantity: 3,
  condition: "Good",
  location: "Storage",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const rentalResponse = {
  _id: "rental-1",
  equipment: "eq-1",
  borrowerName: "Alex",
  borrowerEmail: "alex@example.com",
  quantity: 1,
  startDate: "2026-11-01T00:00:00.000Z",
  dueDate: "2026-11-08T00:00:00.000Z",
  status: "Pending" as const,
  createdAt: "2026-11-01T00:00:00.000Z",
};

describe("API requests", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the deployed backend for inventory, equipment, and rental operations", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const body =
        method === "GET"
          ? url.endsWith("/equipment")
            ? [equipmentResponse]
            : [rentalResponse]
          : url.endsWith("/equipment/eq-1") && method === "DELETE"
            ? { message: "Deleted" }
            : url.endsWith("/equipment") || url.includes("/equipment/")
              ? equipmentResponse
              : rentalResponse;

      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.loadInventory();
    await api.createEquipment({
      id: "eq-1",
      name: equipmentResponse.name,
      category: "Camera",
      description: "",
      totalQuantity: 3,
      condition: "Good",
      location: "Storage",
    });
    await api.updateEquipment("eq-1", {
      id: "eq-1",
      name: equipmentResponse.name,
      category: "Camera",
      description: "",
      totalQuantity: 3,
      condition: "Good",
      location: "Storage",
    });
    await api.deleteEquipment("eq-1");
    await api.createRental({
      equipmentId: "eq-1",
      borrowerName: "Alex",
      borrowerContact: "alex@example.com",
      quantity: 1,
      startDate: "2026-11-01",
      expectedReturnDate: "2026-11-08",
    });
    await api.approveRental("rental-1");
    await api.rejectRental("rental-1");
    await api.returnRental("rental-1", {
      actualReturnDate: "2026-11-08",
      returnCondition: "Good",
    });

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "https://rentalinventory-1.onrender.com/api/equipment",
      "https://rentalinventory-1.onrender.com/api/rentals",
      "https://rentalinventory-1.onrender.com/api/equipment",
      "https://rentalinventory-1.onrender.com/api/equipment/eq-1",
      "https://rentalinventory-1.onrender.com/api/equipment/eq-1",
      "https://rentalinventory-1.onrender.com/api/rentals",
      "https://rentalinventory-1.onrender.com/api/rentals/rental-1/approve",
      "https://rentalinventory-1.onrender.com/api/rentals/rental-1/reject",
      "https://rentalinventory-1.onrender.com/api/rentals/rental-1/return",
    ]);
    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual([
      undefined,
      undefined,
      "POST",
      "PUT",
      "DELETE",
      "POST",
      "POST",
      "POST",
      "POST",
    ]);
  });
});
