import mongoose from "mongoose";
const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  location: { type: String, default: "" },
  totalQuantity: { type: Number, required: true, min: 1 },
  availableQuantity: { type: Number, required: true, min: 0 },
  condition: { type: String, enum: ["Excellent", "Good", "Fair", "Needs repair", "Poor"], default: "Good" },
  imageUrl: { type: String, default: "" },
}, { timestamps: true });
export default mongoose.model("Equipment", equipmentSchema);
