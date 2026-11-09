import type { Category, Condition, Equipment, Rental, RentalStatus } from "./types";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

type ApiEquipment = Omit<Equipment, "id" | "createdAt"> & { _id: string; condition: string; createdAt?: string; updatedAt?: string };
type ApiRental = {
  _id: string;
  equipment: string | { _id: string } | null;
  borrowerName: string;
  borrowerEmail?: string;
  quantity: number;
  startDate: string;
  dueDate: string;
  returnedAt?: string | null;
  status: "Pending" | "Active" | "Returned" | "Rejected";
  returnCondition?: Condition;
  returnNotes?: string;
  notes?: string;
  createdAt: string;
};

const dateOnly = (value?: string | null) => value ? value.slice(0, 10) : "";

const mapEquipment = (item: ApiEquipment): Equipment => ({
  id: item._id,
  name: item.name,
  category: item.category as Category,
  description: item.description ?? "",
  totalQuantity: item.totalQuantity,
  condition: (item.condition as string) === "Poor" ? "Needs repair" : item.condition as Condition,
  location: item.location ?? "",
  imageUrl: item.imageUrl || undefined,
  createdAt: dateOnly(item.createdAt) || new Date().toISOString().slice(0, 10),
});

const mapRental = (item: ApiRental): Rental => ({
  id: item._id,
  equipmentId: typeof item.equipment === "string" ? item.equipment : item.equipment?._id ?? "",
  borrowerName: item.borrowerName,
  borrowerContact: item.borrowerEmail ?? "",
  quantity: item.quantity,
  startDate: dateOnly(item.startDate),
  expectedReturnDate: dateOnly(item.dueDate),
  status: item.status.toLowerCase() as RentalStatus,
  ...(item.notes ? { notes: item.notes } : {}),
  actualReturnDate: dateOnly(item.returnedAt),
  returnCondition: item.returnCondition,
  returnNotes: item.returnNotes,
  createdAt: dateOnly(item.createdAt),
});

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || `Request failed (${response.status})`);
  return body as T;
}

export const api = {
  async loadInventory() {
    const [equipment, rentals] = await Promise.all([
      request<ApiEquipment[]>("/equipment"),
      request<ApiRental[]>("/rentals"),
    ]);
    return { equipment: equipment.map(mapEquipment), rentals: rentals.map(mapRental) };
  },
  createEquipment: async (item: Omit<Equipment, "createdAt">) => mapEquipment(await request<ApiEquipment>("/equipment", { method: "POST", body: JSON.stringify(item) })),
  updateEquipment: async (id: string, item: Omit<Equipment, "createdAt">) => mapEquipment(await request<ApiEquipment>(`/equipment/${id}`, { method: "PUT", body: JSON.stringify(item) })),
  deleteEquipment: (id: string) => request<{ message: string }>(`/equipment/${id}`, { method: "DELETE" }),
  createRental: async (rental: Omit<Rental, "id" | "status" | "createdAt">) => mapRental(await request<ApiRental>("/rentals", {
    method: "POST",
    body: JSON.stringify({ ...rental, borrowerEmail: rental.borrowerContact, dueDate: rental.expectedReturnDate }),
  })),
  approveRental: async (id: string) => mapRental(await request<ApiRental>(`/rentals/${id}/approve`, { method: "POST" })),
  rejectRental: async (id: string) => mapRental(await request<ApiRental>(`/rentals/${id}/reject`, { method: "POST" })),
  returnRental: async (id: string, data: { actualReturnDate: string; returnCondition: Condition; returnNotes?: string }) => mapRental(await request<ApiRental>(`/rentals/${id}/return`, {
    method: "POST",
    body: JSON.stringify({ ...data, returnedAt: data.actualReturnDate }),
  })),
};