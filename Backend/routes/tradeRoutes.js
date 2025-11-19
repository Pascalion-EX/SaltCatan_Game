import express from "express";
import Trade from "../models/Trade.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ===============================
    USER — CREATE TRADE REQUEST
================================ */
router.post("/create", auth, async (req, res) => {
  try {
    const { offer, want } = req.body;

    const trade = await Trade.create({
      offer,
      want,
      user: req.user.id,
    });

    res.json(trade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
    ADMIN — GET ALL TRADES
================================ */
router.get("/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    const trades = await Trade.find()
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
    ADMIN — ACCEPT / DECLINE TRADE
================================ */
router.put("/update/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    const trade = await Trade.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(trade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
