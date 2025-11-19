import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
  offer: { type: String, required: true },
  want: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "declined"], 
    default: "pending" 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Trade", tradeSchema);
