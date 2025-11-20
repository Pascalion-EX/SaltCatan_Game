import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: "user" },
  inventory: {
    victoryPoint: { type: Number, default: 0 },
    knight: { type: Number, default: 0 },
    roadBuilding: { type: Number, default: 0 },
    yearOfPlenty: { type: Number, default: 0 },
    monopoly: { type: Number, default: 0 },
  },
  resources: {
    wood: { type: Number, default: 0 },
    brick: { type: Number, default: 0 },
    iron: { type: Number, default: 0 },
    wheat: { type: Number, default: 0 },
    sheep: { type: Number, default: 0 },
  },
  Token: { type: Number, default: 0 },   // <-- FIXED SPELLING
  house: { type: Number, default: 2 },
  village: { type: Number, default: 0 },
  roads: { type: Number, default: 2 },
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// =========================
// 🏆 VIRTUAL SCORE
// =========================
userSchema.virtual("score").get(function () {
  const victoryPoints = this.inventory?.victoryPoint || 0;
  return (
    (this.house || 0) * 1 +
    (this.village || 0) * 2 +
    victoryPoints * 1
  );
});

// =========================
// 🃏 VIRTUAL TOTAL CARDS
// =========================
userSchema.virtual("totalCards").get(function () {
  if (!this.inventory) return 0;
  return Object.values(this.inventory).reduce((a, b) => a + (b || 0), 0);
});

// =========================
// 🌾 VIRTUAL TOTAL RESOURCES
// =========================
userSchema.virtual("totalResources").get(function () {
  if (!this.resources) return 0;
  return Object.values(this.resources).reduce((a, b) => a + (b || 0), 0);
});

// =========================
// 📊 VIRTUAL TOTAL SUM (cards + resources)
// =========================
userSchema.virtual("totalSum").get(function () {
  return this.totalCards + this.totalResources;
});

// =========================
// 🔐 Match Password
// =========================
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// =========================
// 🔐 Hash password
// =========================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);
export default User;
