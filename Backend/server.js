import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import { connectDB } from "./config/db.js";
import tradeRoutes from "./routes/tradeRoutes.js";

dotenv.config();

const app = express();

// ✅ CORS setup: must come BEFORE routes
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ Routes
app.use("/api/users", authRoutes);
app.use("/api/trade", tradeRoutes);


// ✅ MongoDB
connectDB();
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});


// ✅ Export app for Vercel
export default app;
