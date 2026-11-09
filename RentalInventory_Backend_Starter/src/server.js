import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import equipmentRoutes from "./routes/equipment.js";
import rentalRoutes from "./routes/rentals.js";

dotenv.config();
const app = express();
app.use(cors({
  origin: [
    "https://rental-inventory-faco.vercel.app",
    "http://localhost:8080",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "RentalInventory API" }));
app.use("/api/equipment", equipmentRoutes);
app.use("/api/rentals", rentalRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI. Add it to backend/.env");
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`RentalInventory API running at http://localhost:${PORT}`));
} catch (error) {
  console.error("MongoDB connection failed:", error.message);
  process.exit(1);
}
