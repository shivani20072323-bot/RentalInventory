// Domain models. Shapes mirror the planned MongoDB collections (id -> _id later).
export type Category = "Audio" | "Camera" | "Computing" | "Sports" | "Outdoor" | "Event";
export type Condition = "Excellent" | "Good" | "Fair" | "Needs repair";
export type RentalStatus = "pending" | "active" | "returned" | "rejected";

export interface Equipment {
  id: string; // e.g. EQ-1001
  name: string;
  category: Category;
  description: string;
  totalQuantity: number;
  condition: Condition;
  location: string;
  imageUrl?: string | undefined;
  createdAt: string;
}

export interface Rental {
  id: string; // e.g. RN-2041
  equipmentId: string;
  borrowerName: string;
  borrowerContact: string;
  quantity: number;
  startDate: string; // YYYY-MM-DD
  expectedReturnDate: string;
  status: RentalStatus;
  notes?: string | undefined;
  actualReturnDate?: string | undefined;
  returnCondition?: Condition | undefined;
  returnNotes?: string | undefined;
  createdAt: string;
}

export const CATEGORIES: Category[] = ["Audio", "Camera", "Computing", "Sports", "Outdoor", "Event"];
export const CONDITIONS: Condition[] = ["Excellent", "Good", "Fair", "Needs repair"];
