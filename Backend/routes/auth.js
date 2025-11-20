import express from "express";
import User from "../models/Users.js";
import jwt from "jsonwebtoken";
import { protect, adminOnly } from "../middleware/auth.js";
import Trade from "../models/Trade.js";

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const usernameExists = await User.findOne({ username }).lean();
    const emailExists = await User.findOne({ email }).lean();
    if (usernameExists || emailExists) {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);
    const u = await User.findById(user._id).lean({ virtuals: true });
    res.status(201).json({ ...u, token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password)
      return res.status(400).json({ message: "Please fill all the fields" });
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });
    const token = generateToken(user._id);
    const u = await User.findById(user._id).lean({ virtuals: true });
    res.status(200).json({ ...u, token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", protect, async (req, res) => {
  const u = await User.findById(req.user._id).lean({ virtuals: true });
  res.status(200).json(u);
});

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .lean({ virtuals: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/inventory/:id", protect, async (req, res) => {
  try {
    const { card, amount } = req.body;
    if (req.user._id.toString() !== req.params.id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const user = await User.findById(req.params.id);
    if (!user || !(card in user.inventory)) {
      return res.status(400).json({ message: "Invalid card" });
    }
    user.inventory[card] = Math.max(0, amount);
    await user.save();
    const u = await User.findById(req.params.id).lean({ virtuals: true });
    res.status(200).json(u);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/tokens/:id", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (req.user._id.toString() !== req.params.id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const user = await User.findById(req.params.id);
    user.Token = Math.max(0, (user.Token || 0) + amount);
    await user.save();
    const u = await User.findById(req.params.id).lean({ virtuals: true });
    res.status(200).json(u);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({})
      .select("username email inventory resources house village roads role Token")
      .lean({ virtuals: true });
    res.status(200).json(users);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/buildings/:id", protect, adminOnly, async (req, res) => {
  try {
    const { type, amount } = req.body;
    const valid = ["house", "village", "roads"];
    if (!valid.includes(type)) return res.status(400).json({ message: "Invalid building type" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user[type] = Math.max(0, amount);
    await user.save();
    const u = await User.findById(req.params.id).lean({ virtuals: true });
    res.status(200).json(u);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/resources/:id", protect, adminOnly, async (req, res) => {
  try {
    const { resource, amount } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || !(resource in user.resources)) {
      return res.status(400).json({ message: "Invalid resource" });
    }
    user.resources[resource] = Math.max(0, amount);
    await user.save();
    const u = await User.findById(req.params.id).lean({ virtuals: true });
    res.status(200).json(u);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/inventory/:id", protect, adminOnly, async (req, res) => {
  try {
    const { card, amount } = req.body;
    const validCards = ["victoryPoint", "knight", "roadBuilding", "yearOfPlenty", "monopoly"];
    if (!validCards.includes(card)) return res.status(400).json({ message: "Invalid card name" });
    const user = await User.findById(req.params.id);
    user.inventory[card] = Math.max(0, amount);
    await user.save();
    const u = await User.findById(req.params.id).lean({ virtuals: true });
    res.status(200).json(u);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/edit/:id", protect, adminOnly, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (username) user.username = username;
    if (email) user.email = email;
    await user.save();
    const u = await User.findById(req.params.id).lean({ virtuals: true });
    res.status(200).json(u);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all", protect, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("username email house village roads")
      .lean({ virtuals: true });
    res.status(200).json(users);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/tokens/:id", protect, adminOnly, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.Token = Math.max(0, (user.Token || 0) + amount);
    await user.save();
    const u = await User.findById(req.params.id).lean({ virtuals: true });
    res.status(200).json(u);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/trade/create", protect, async (req, res) => {
  try {
    const { offer, want } = req.body;
    if (!offer || !want) return res.status(400).json({ message: "Offer and want are required" });
    const trade = await Trade.create({ offer, want, user: req.user._id, status: "pending" });
    res.status(201).json(trade);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/trade/all", protect, async (req, res) => {
  try {
    const trades = await Trade.find()
      .populate({ path: "user", select: "username email role", options: { lean: true } })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(trades);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/trade/update/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const updated = await Trade.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ message: "Trade not found" });
    res.status(200).json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
