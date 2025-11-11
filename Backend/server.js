import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

// 🧩 Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// 🧩 Middleware & Routes
app.use(express.json());
app.use("/api/users", authRoutes);
connectDB();

// ✅ Export the app for Vercel serverless functions
export default app;
