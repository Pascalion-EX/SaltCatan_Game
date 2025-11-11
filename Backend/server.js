import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import { connectDB } from "./config/db.js";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // allow frontend to connect (change origin if needed)
});

const PORT = process.env.PORT || 5000;

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

// 🕒 TURN TIMER LOGIC
let turnIndex = 0;
let timeLeft = 60;

setInterval(() => {
  timeLeft--;
  if (timeLeft <= 0) {
    turnIndex++;
    timeLeft = 60;
  }
  io.emit("updateTurn", { index: turnIndex, timer: timeLeft });
}, 1000);

io.on("connection ", (socket) => {
  console.log("🟢 Client connected:", socket.id);
  socket.emit("updateTurn", { index: turnIndex, timer: timeLeft });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// 🚀 Start Server
server.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
