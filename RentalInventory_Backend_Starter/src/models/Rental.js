import mongoose from "mongoose";
const rentalSchema = new mongoose.Schema({
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
  borrowerName: { type: String, required: true, trim: true },
  borrowerEmail: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  returnedAt: { type: Date, default: null },
  status: { type: String, enum: ["Pending", "Active", "Returned", "Rejected"], default: "Pending" },
  returnCondition: { type: String, enum: ["Excellent", "Good", "Fair", "Needs repair", "Damaged"], default: "Good" },
  returnNotes: { type: String, default: "" },
  notes: { type: String, default: "" },
}, { timestamps: true });
export default mongoose.model("Rental", rentalSchema);
