import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import type { InventorySnapshot } from "./storage";
import type { Condition, Equipment, Rental } from "./types";

interface InventoryContextValue extends InventorySnapshot {
  getEquipment: (id: string) => Equipment | undefined;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addEquipment: (e: Omit<Equipment, "createdAt">) => Promise<void>;
  updateEquipment: (id: string, e: Omit<Equipment, "createdAt">) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  createRental: (r: Omit<Rental, "id" | "status" | "createdAt">) => Promise<string>;
  approveRental: (id: string) => Promise<{ ok: boolean; reason?: string }>;
  rejectRental: (id: string) => Promise<void>;
  returnRental: (id: string, data: { actualReturnDate: string; returnCondition: Condition; returnNotes?: string }) => Promise<void>;
  resetData: () => Promise<void>;
}

const Ctx = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<InventorySnapshot>({ equipment: [], rentals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.loadInventory());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const getEquipment = useCallback((id: string) => data.equipment.find((e) => e.id === id), [data.equipment]);

  const value = useMemo<InventoryContextValue>(() => ({
    ...data,
    loading,
    error,
    refresh,
    getEquipment,
    addEquipment: async (e) => { try { await api.createEquipment(e); await refresh(); setError(null); } catch (err) { const message = err instanceof Error ? err.message : "Unable to add equipment"; setError(message); throw new Error(message); } },
    updateEquipment: async (id, e) => { try { await api.updateEquipment(id, e); await refresh(); setError(null); } catch (err) { const message = err instanceof Error ? err.message : "Unable to update equipment"; setError(message); throw new Error(message); } },
    deleteEquipment: async (id) => { try { await api.deleteEquipment(id); await refresh(); setError(null); } catch (err) { const message = err instanceof Error ? err.message : "Unable to delete equipment"; setError(message); throw new Error(message); } },
    createRental: async (r) => { try { const created = await api.createRental(r); await refresh(); setError(null); return created.id; } catch (err) { const message = err instanceof Error ? err.message : "Unable to create rental"; setError(message); throw new Error(message); } },
    approveRental: async (id) => { try { await api.approveRental(id); await refresh(); setError(null); return { ok: true }; } catch (err) { const reason = err instanceof Error ? err.message : "Unable to approve rental"; setError(reason); return { ok: false, reason }; } },
    rejectRental: async (id) => { try { await api.rejectRental(id); await refresh(); setError(null); } catch (err) { const message = err instanceof Error ? err.message : "Unable to reject rental"; setError(message); throw new Error(message); } },
    returnRental: async (id, info) => { try { await api.returnRental(id, info); await refresh(); setError(null); } catch (err) { const message = err instanceof Error ? err.message : "Unable to record return"; setError(message); throw new Error(message); } },
    resetData: refresh,
  }), [data, error, getEquipment, loading, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventory() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInventory must be used inside InventoryProvider");
  return v;
}
