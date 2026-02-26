import mongoose from "../lib/db.server";

const schema = new mongoose.Schema({
  shop: { type: String, required: true },
  email: { type: String, required: true },
  totalpoints: { type: Number, default: 0 },
  availablePoints: { type: Number, default: 0 },
  order: [
    {
      orderId: String,
      pointsEarned: Number,
      date: Date
    }
  ],
  redeemed: [
    {
      orderId: String,
      pointsUsed: Number,
      date: Date
    }
  ]
});

// ✅ THIS IS THE CORRECT WAY
export default mongoose.models.CustomerPoints ||
  mongoose.model("CustomerPoints", schema);