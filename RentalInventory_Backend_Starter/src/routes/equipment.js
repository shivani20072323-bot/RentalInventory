import { Router } from "express";
import Equipment from "../models/Equipment.js";
import Rental from "../models/Rental.js";
const router = Router();

router.get("/", async (_req, res, next) => {
  try { res.json(await Equipment.find().sort({ createdAt: -1 })); } catch (e) { next(e); }
});
router.post("/", async (req, res, next) => {
  try {
    const { name, category, totalQuantity } = req.body;
    if (!name?.trim() || !category?.trim() || Number(totalQuantity) < 1) return res.status(400).json({ message: "Name, category and quantity (at least 1) are required." });
    const item = await Equipment.create({ ...req.body, totalQuantity: Number(totalQuantity), availableQuantity: Number(req.body.availableQuantity ?? totalQuantity) });
    res.status(201).json(item);
  } catch (e) { next(e); }
});
router.get("/:id", async (req, res, next) => {
  try { const item = await Equipment.findById(req.params.id); if (!item) return res.status(404).json({message:"Equipment not found"}); res.json(item); } catch (e) { next(e); }
});
router.put("/:id", async (req, res, next) => {
  try {
    const item = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({message:"Equipment not found"});
    res.json(item);
  } catch (e) { next(e); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const active = await Rental.exists({ equipment: req.params.id, status: "Active" });
    if (active) return res.status(409).json({message:"Cannot delete equipment with active rentals."});
    const item = await Equipment.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({message:"Equipment not found"});
    res.json({message:"Equipment deleted"});
  } catch (e) { next(e); }
});
export default router;
