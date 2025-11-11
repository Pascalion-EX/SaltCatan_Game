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
    stone: { type: Number, default: 0 },
    iron: { type: Number, default: 0 },
    wheat: { type: Number, default: 0 },
    lamb: { type: Number, default: 0 },
  },
  Token: {type: Number, defult:0},
  house: { type: Number, default: 2 },
  village: { type: Number, default: 0 },
  roads: {type: Number, default:2},
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🧮 Virtual field for score
userSchema.virtual("score").get(function () {
  const victoryPoints = this.inventory?.victoryPoint || 0;
  return (
    (this.house || 0) * 1 +
    (this.village || 0) * 2 +
    victoryPoints * 1
  );
});


// ✅ Password check
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);
export default User;
