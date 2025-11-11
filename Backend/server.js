import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

// ✅ CORS setup: must come BEFORE routes
app.use(
  cors({
    origin: [
       "https://salt-catan-game-mrom-exsayqco5-kerolosafam-gmailcoms-projects.vercel.app",
      "https://salt-catan-game-mrom.vercel.app/", // your frontend on Vercel
      "http://localhost:5173" // local dev
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ Routes
app.use("/api/users", authRoutes);

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
