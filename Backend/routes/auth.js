import express from "express";
import User from "../models/Users.js";
import jwt from "jsonwebtoken";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

/* ---------------------------------------
   JWT Helper
---------------------------------------- */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/* ---------------------------------------
   PUBLIC ROUTES (NO AUTH)
---------------------------------------- */

// REGISTER
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const usernameExists = await User.findOne({ username });
    const emailExists = await User.findOne({ email });

    if (usernameExists || emailExists) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const user = await User.create({ username, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      inventory: user.inventory,
      resources: user.resources,
      score: 0,
      token,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password)
      return res.status(400).json({ message: "Please fill all the fields" });

    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    const score =
      (user.house || 0) * 1 +
      (user.village || 0) * 2 +
      (user.inventory?.victoryPoint || 0) * 1;

    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      inventory: user.inventory,
      resources: user.resources,
      house: user.house,
      village: user.village,
      roads: user.roads,
      score,
      token,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------
   USER ROUTES (AUTH REQUIRED)
---------------------------------------- */

// GET MY PROFILE
router.get("/me", protect, async (req, res) => {
  const user = req.user;

  const score =
    (user.house || 0) * 1 +
    (user.village || 0) * 2 +
    (user.inventory?.victoryPoint || 0) * 1;

  res.status(200).json({ ...user._doc, score });
});

// GET PROFILE BY ID
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// USER updates their own inventory
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

    res.status(200).json({
      message: "Inventory updated",
      inventory: user.inventory,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// USER updates their own tokens
router.put("/tokens/:id", protect, async (req, res) => {
  try {
    const { amount } = req.body;

    if (req.user._id.toString() !== req.params.id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.params.id);

    user.Token = Math.max(0, (user.Token || 0) + amount);
    await user.save();

    res.status(200).json({
      message: "Tokens updated",
      tokens: user.Token,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------
   ADMIN ROUTES (ADMIN ONLY)
---------------------------------------- */

// ADMIN: get all users
router.get("/admin/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find(
      {},
      "username email inventory resources house village roads role"
    );

    const formatted = users.map((u) => ({
      ...u._doc,
      inventory: u.inventory || {},
      resources: u.resources || {},
      house: u.house ?? 0,
      village: u.village ?? 0,
      roads: u.roads ?? 0,
      score:
        (u.house || 0) * 1 +
        (u.village || 0) * 2 +
        (u.inventory?.victoryPoint || 0) * 1,
    }));

    res.status(200).json(formatted);

  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: update buildings
router.put("/admin/buildings/:id", protect, adminOnly, async (req, res) => {
  try {
    const { type, amount } = req.body;

    const valid = ["house", "village", "roads"];
    if (!valid.includes(type))
      return res.status(400).json({ message: "Invalid building type" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user[type] = Math.max(0, amount);
    await user.save();

    res.status(200).json({ message: "Building updated", user });

  } catch (err) {
    console.error("BUILDING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: update resources
router.put("/admin/resources/:id", protect, adminOnly, async (req, res) => {
  try {
    const { resource, amount } = req.body;

    const user = await User.findById(req.params.id);
    if (!user || !(resource in user.resources)) {
      return res.status(400).json({ message: "Invalid resource" });
    }

    user.resources[resource] = Math.max(0, amount);
    await user.save();

    res.status(200).json({ message: "Resources updated", user });

  } catch (err) {
    console.error("RESOURCE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: update inventory
router.put("/admin/inventory/:id", protect, adminOnly, async (req, res) => {
  try {
    const { card, amount } = req.body;

    const validCards = [
      "victoryPoint",
      "knight",
      "roadBuilding",
      "yearOfPlenty",
      "monopoly",
    ];

    if (!validCards.includes(card))
      return res.status(400).json({ message: "Invalid card name" });

    const user = await User.findById(req.params.id);

    user.inventory[card] = Math.max(0, amount);
    await user.save();

    res.status(200).json({ message: "Inventory updated", user });

  } catch (err) {
    console.error("ADMIN INVENTORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN: edit username/email
router.put("/admin/edit/:id", protect, adminOnly, async (req, res) => {
  try {
    const { username, email } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({ message: "User updated", user });

  } catch (err) {
    console.error("ADMIN EDIT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
