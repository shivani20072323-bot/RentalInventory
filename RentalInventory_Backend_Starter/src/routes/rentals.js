import { Router } from "express";
import mongoose from "mongoose";
import Rental from "../models/Rental.js";
import Equipment from "../models/Equipment.js";
const router = Router();

router.get("/", async (_req, res, next) => {
  try { res.json(await Rental.find().populate("equipment").sort({ createdAt: -1 })); } catch (e) { next(e); }
});
router.get("/overdue", async (_req, res, next) => {
  try { res.json(await Rental.find({ status: "Active", dueDate: { $lt: new Date() } }).populate("equipment")); } catch (e) { next(e); }
});
router.post("/", async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { equipmentId, borrowerName, borrowerEmail, quantity = 1, startDate, dueDate, notes = "" } = req.body;
    if (!equipmentId || !borrowerName?.trim() || !startDate || !dueDate || Number(quantity) < 1) return res.status(400).json({ message: "Equipment, borrower, quantity, start date and due date are required." });
    if (new Date(dueDate) < new Date(startDate)) return res.status(400).json({ message: "Due date must be on or after start date." });
    let created;
    await session.withTransaction(async () => {
      const item = await Equipment.findById(equipmentId).session(session);
      if (!item) throw Object.assign(new Error("Equipment not found"), { status: 404 });
      if (item.availableQuantity < Number(quantity)) throw Object.assign(new Error("Not enough equipment available"), { status: 409 });
      const docs = await Rental.create([{ equipment: equipmentId, borrowerName, borrowerEmail, notes, quantity: Number(quantity), startDate, dueDate, status: "Pending" }], { session });
      created = docs[0];
    });
    res.status(201).json(await created.populate("equipment"));
  } catch (e) { next(e); } finally { await session.endSession(); }
});
router.post("/:id/approve", async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const rental = await Rental.findById(req.params.id).session(session);
      if (!rental) throw Object.assign(new Error("Rental not found"), { status: 404 });
      if (rental.status !== "Pending") throw Object.assign(new Error("Only pending rentals can be approved"), { status: 409 });
      const item = await Equipment.findById(rental.equipment).session(session);
      if (!item) throw Object.assign(new Error("Equipment not found"), { status: 404 });
      if (item.availableQuantity < rental.quantity) throw Object.assign(new Error("Not enough equipment available"), { status: 409 });
      item.availableQuantity -= rental.quantity;
      await item.save({ session });
      rental.status = "Active";
      await rental.save({ session });
      updated = rental;
    });
    res.json(await updated.populate("equipment"));
  } catch (e) { next(e); } finally { await session.endSession(); }
});
router.post("/:id/reject", async (req, res, next) => {
  try {
    const rental = await Rental.findOneAndUpdate({ _id: req.params.id, status: "Pending" }, { status: "Rejected" }, { new: true }).populate("equipment");
    if (!rental) return res.status(404).json({ message: "Pending rental not found" });
    res.json(rental);
  } catch (e) { next(e); }
});
router.post("/:id/return", async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const rental = await Rental.findById(req.params.id).session(session);
      if (!rental) throw Object.assign(new Error("Rental not found"), { status: 404 });
      if (rental.status !== "Active") throw Object.assign(new Error("Only active rentals can be returned"), { status: 409 });
      const item = await Equipment.findById(rental.equipment).session(session);
      if (!item) throw Object.assign(new Error("Equipment not found"), { status: 404 });
      item.availableQuantity = Math.min(item.totalQuantity, item.availableQuantity + rental.quantity);
      await item.save({ session });
      rental.status = "Returned"; rental.returnedAt = req.body.actualReturnDate || new Date();
      if (req.body.returnCondition) rental.returnCondition = req.body.returnCondition;
      if (req.body.returnNotes) rental.returnNotes = req.body.returnNotes;
      await rental.save({ session });
      updated = rental;
    });
    res.json(await updated.populate("equipment"));
  } catch (e) { next(e); } finally { await session.endSession(); }
});
export default router;
