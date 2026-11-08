import type { Equipment, Rental } from "./types";

export interface InventorySnapshot {
  equipment: Equipment[];
  rentals: Rental[];
}

