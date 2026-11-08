import { addDays, todayISO } from "./rental-utils";
import type { Equipment, Rental } from "./types";

const eq = (
  id: string, name: string, category: Equipment["category"], totalQuantity: number,
  location: string, description: string, condition: Equipment["condition"] = "Good",
): Equipment => ({ id, name, category, totalQuantity, location, description, condition, createdAt: "2026-08-01" });

export const sampleEquipment = (): Equipment[] => [
  eq("EQ-1001", "Sony A7 III Camera Kit", "Camera", 4, "Media Room B2", "Full-frame mirrorless with 28–70mm lens, 2 batteries.", "Excellent"),
  eq("EQ-1002", "Rode Wireless GO II", "Audio", 6, "Media Room B2", "Dual-channel wireless mic system."),
  eq("EQ-1003", "JBL EON615 PA Speaker", "Audio", 4, "Auditorium Store", "15\" powered PA speaker, 1000W."),
  eq("EQ-1004", "Epson EB-X51 Projector", "Event", 5, "AV Cabinet 1", "3800 lumen XGA projector with HDMI."),
  eq("EQ-1005", "MacBook Pro 14\"", "Computing", 8, "IT Desk", "M3 Pro, 18GB RAM, editing suite installed.", "Excellent"),
  eq("EQ-1006", "DJI Mini 4 Pro Drone", "Camera", 2, "Media Room B2", "Requires drone safety briefing before use."),
  eq("EQ-1007", "4-Person Camping Tent", "Outdoor", 10, "Outdoor Club Shed", "Waterproof dome tent with footprint.", "Fair"),
  eq("EQ-1008", "Football Training Set", "Sports", 6, "Sports Complex", "10 cones, 5 balls, pump, bibs."),
  eq("EQ-1009", "Badminton Racket Pair", "Sports", 12, "Sports Complex", "Yonex rackets with shuttle tube."),
  eq("EQ-1010", "Folding Event Table", "Event", 20, "Hall Basement", "6ft heavy-duty folding table."),
  eq("EQ-1011", "iPad Air + Pencil", "Computing", 6, "IT Desk", "For design workshops and sign-ups."),
  eq("EQ-1012", "Godox SL60W LED Light", "Camera", 3, "Media Room B2", "60W continuous light with softbox.", "Needs repair"),
];

export const sampleRentals = (): Rental[] => {
  const t = todayISO();
  const r = (
    id: string, equipmentId: string, borrowerName: string, borrowerContact: string, quantity: number,
    startOffset: number, returnOffset: number, status: Rental["status"], extra: Partial<Rental> = {},
  ): Rental => ({
    id, equipmentId, borrowerName, borrowerContact, quantity,
    startDate: addDays(t, startOffset), expectedReturnDate: addDays(t, returnOffset),
    status, createdAt: addDays(t, startOffset - 1), ...extra,
  });
  return [
    r("RN-2041", "EQ-1001", "Aarav Mehta", "aarav.m@college.edu", 1, -3, 2, "active", { notes: "Photography club shoot" }),
    r("RN-2042", "EQ-1003", "Drama Society", "drama@college.edu", 2, -6, -2, "active"),
    r("RN-2043", "EQ-1007", "Priya Nair", "+91 98450 22114", 3, -10, -5, "active", { notes: "Trek to Kudremukh" }),
    r("RN-2044", "EQ-1005", "Rohan Das", "rohan.das@college.edu", 1, -1, 6, "active"),
    r("RN-2045", "EQ-1004", "Robotics Club", "robotics@college.edu", 1, -2, 0, "active"),
    r("RN-2046", "EQ-1002", "Sneha Iyer", "sneha.i@college.edu", 2, 1, 4, "pending", { notes: "Podcast recording" }),
    r("RN-2047", "EQ-1010", "Cultural Committee", "culture@college.edu", 8, 2, 3, "pending"),
    r("RN-2048", "EQ-1006", "Kabir Singh", "+91 99001 55620", 1, -9, -1, "active"),
    r("RN-2049", "EQ-1009", "Ananya Rao", "ananya.r@college.edu", 2, -14, -10, "returned", { actualReturnDate: addDays(t, -10), returnCondition: "Good" }),
    r("RN-2050", "EQ-1008", "Football Team", "sports@college.edu", 1, -20, -15, "returned", { actualReturnDate: addDays(t, -13), returnCondition: "Fair" }),
    r("RN-2051", "EQ-1001", "Media Cell", "media@college.edu", 2, -25, -20, "returned", { actualReturnDate: addDays(t, -20), returnCondition: "Excellent" }),
    r("RN-2052", "EQ-1011", "Design Club", "design@college.edu", 4, -4, 3, "active"),
    r("RN-2053", "EQ-1012", "Vikram Joshi", "vikram.j@college.edu", 1, -5, -3, "rejected", { notes: "Item under repair" }),
    r("RN-2054", "EQ-1005", "Hackathon Team", "hack@college.edu", 3, -40, -37, "returned", { actualReturnDate: addDays(t, -36), returnCondition: "Good" }),
    r("RN-2055", "EQ-1003", "Music Club", "music@college.edu", 2, -55, -52, "returned", { actualReturnDate: addDays(t, -52), returnCondition: "Good" }),
    r("RN-2056", "EQ-1007", "Outdoor Club", "outdoor@college.edu", 4, -70, -65, "returned", { actualReturnDate: addDays(t, -63), returnCondition: "Fair" }),
    r("RN-2057", "EQ-1004", "Placement Cell", "placement@college.edu", 2, -85, -84, "returned", { actualReturnDate: addDays(t, -84), returnCondition: "Good" }),
    r("RN-2058", "EQ-1001", "Aarav Mehta", "aarav.m@college.edu", 1, -100, -96, "returned", { actualReturnDate: addDays(t, -95), returnCondition: "Good" }),
    r("RN-2059", "EQ-1002", "NSS Unit", "nss@college.edu", 3, -120, -118, "returned", { actualReturnDate: addDays(t, -118), returnCondition: "Excellent" }),
  ];
};
