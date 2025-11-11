import express from "express";
import User from "../models/Users.js";
import { protect } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import { adminOnly } from "../middleware/auth.js";

const router = express.Router();
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
// 🧩 Admin: update buildings (house, village, roads)
router.put("/admin/buildings/:id", protect, adminOnly, async (req, res) => {
  try {
    const { type, amount } = req.body; // type = "house" | "village" | "roads"
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // validate field
    if (!["house", "village", "roads"].includes(type)) {
      return res.status(400).json({ message: "Invalid building type" });
    }

    // update and save
    user[type] = Math.max(0, amount);
    await user.save();

    res.status(200).json({
      message: `${type} updated successfully`,
      user,
    });
  } catch (err) {
    console.error("Error updating building:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// 🧩 Admin: get all users (with roads too)
router.get("/admin/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find(
      {},
      "username email inventory resources house village roads role"
    );

    const safeUsers = users.map((u) => ({
      ...u._doc,
      inventory: u.inventory || {},
      resources: u.resources || {},
      house: u.house ?? 0,
      village: u.village ?? 0,
      roads: u.roads ?? 0, // ✅ ensure roads is always present
      score:
        (u.house || 0) * 1 +
        (u.village || 0) * 2 +
        (u.inventory?.victoryPoint || 0) * 1,
    }));

    res.status(200).json(safeUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// 🧩 Admin: update buildings (house/village)
router.put("/admin/buildings/:id", protect, adminOnly, async (req, res) => {
  try {
    const { house, village } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (house !== undefined) user.house = Math.max(0, house);
    if (village !== undefined) user.village = Math.max(0, village);

    await user.save();

    const updatedUser = {
      ...user._doc,
      score:
        (user.house || 0) * 1 +
        (user.village || 0) * 2 +
        (user.inventory?.victoryPoint || 0) * 1,
    };

    res.status(200).json({ message: "Buildings updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧩 Admin: update resources
router.put("/admin/resources/:id", protect, adminOnly, async (req, res) => {
  try {
    const { resource, amount } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || !(resource in user.resources)) {
      return res.status(400).json({ message: "Invalid resource" });
    }

    user.resources[resource] = Math.max(0, amount);
    await user.save();

    const updatedUser = {
      ...user._doc,
      score:
        (user.house || 0) * 1 +
        (user.village || 0) * 2 +
        (user.inventory?.victoryPoint || 0) * 1,
    };

    res.status(200).json({ message: "Resources updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧩 Admin: update user's card inventory
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

    if (!validCards.includes(card)) {
      return res.status(400).json({ message: "Invalid card name" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.inventory[card] = Math.max(0, amount);
    await user.save();

    const updatedUser = {
      ...user._doc,
      score:
        (user.house || 0) * 1 +
        (user.village || 0) * 2 +
        (user.inventory?.victoryPoint || 0) * 1,
    };

    res
      .status(200)
      .json({ message: "User inventory updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧩 Admin: edit user's username and email
router.put("/admin/edit/:id", protect, adminOnly, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    const updatedUser = {
      ...user._doc,
      score:
        (user.house || 0) * 1 +
        (user.village || 0) * 2 +
        (user.inventory?.victoryPoint || 0) * 1,
    };

    res.status(200).json({ message: "User details updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// 👥 Public route: all non-admin users can view team summaries
router.get("/all", protect, async (req, res) => {
  try {
    const users = await User.find(
      { role: { $ne: "admin" } },
      "username email house village roads score"
    );
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// 🪙 Admin: add tokens to a user
router.put("/admin/tokens/:id", protect, adminOnly, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.Token = (user.Token || 0) + amount;
    await user.save();

    res.status(200).json({ message: "Tokens updated", tokens: user.Token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🎴 User: update their own inventory (no admin needed)
router.put("/inventory/:id", protect, async (req, res) => {
  try {
    const { card, amount } = req.body;

    // only allow updating your own account
    if (req.user._id.toString() !== req.params.id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.params.id);
    if (!user || !(card in user.inventory)) {
      return res.status(400).json({ message: "Invalid card" });
    }

    user.inventory[card] = Math.max(0, amount);
    await user.save();

    res.status(200).json({ message: "Inventory updated", inventory: user.inventory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// 🪙 User: update their own tokens (safe route, not admin-only)
router.put("/tokens/:id", protect, async (req, res) => {
  try {
    const { amount } = req.body;

    // only allow updating your own tokens
    if (req.user._id.toString() !== req.params.id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.Token = Math.max(0, (user.Token || 0) + amount);
    await user.save();

    res.status(200).json({ message: "Tokens updated", tokens: user.Token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// 🧩 Register new user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password)
      return res.status(400).json({ message: "Please fill all the fields" });

    const usernameExists = await User.findOne({ username });
    const emailExists = await User.findOne({ email });
    if (usernameExists || emailExists)
      return res
        .status(400)
        .json({ message: "Username or email already exists" });

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    const newUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      inventory: user.inventory,
      resources: user.resources,
      score: 0,
      token,
    };

    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// 🧩 Admin: update buildings
router.put("/admin/buildings/:id", protect, adminOnly, async (req, res) => {
  try {
    const { type, amount } = req.body; // type = "house" | "village" | "roads"
    const user = await User.findById(req.params.id);

    if (!user || !["house", "village", "roads"].includes(type)) {
      return res.status(400).json({ message: "Invalid building type" });
    }

    user[type] = Math.max(0, amount);
    await user.save();
    res.status(200).json({ message: "Building count updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// 🧩 Login (username-based)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password)
      return res.status(400).json({ message: "Please fill all the fields" });

    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    const userWithScore = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      inventory: user.inventory,
      resources: user.resources,
      house: user.house,
      village: user.village,
      score:
        (user.house || 0) * 1 +
        (user.village || 0) * 2 +
        (user.inventory?.victoryPoint || 0) * 1,
      token,
    };

    res.status(200).json(userWithScore);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧩 Update own inventory
router.put("/inventory", protect, async (req, res) => {
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

    const user = await User.findById(req.user.id);
    user.inventory[card] = Math.max(0, amount);
    await user.save();

    const updatedUser = {
      ...user._doc,
      score:
        (user.house || 0) * 1 +
        (user.village || 0) * 2 +
        (user.inventory?.victoryPoint || 0) * 1,
    };

    res.status(200).json({
      message: "Inventory updated",
      inventory: updatedUser.inventory,
      score: updatedUser.score,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧩 Me (authenticated user info)
router.get("/me", protect, async (req, res) => {
  const user = req.user;
  const userWithScore = {
    ...user._doc,
    score:
      (user.house || 0) * 1 +
      (user.village || 0) * 2 +
      (user.inventory?.victoryPoint || 0) * 1,
  };
  res.status(200).json(userWithScore);
});

// 🧩 Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export default router;
