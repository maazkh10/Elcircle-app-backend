
import mongoose from "../lib/db.server";

const schema = new mongoose.Schema({
    email: String,
    totalpoints : {type: Number, default: 0},
    availablePoints: { type: Number, default: 0 },
    order:[
        {
            orderId : String,
            pointsEarned: Number,
            date: Date
        }
    ]
});

export default mongoose.model.CustomerPoints ||
 mongoose.model("CustomerPoints" , schema);
