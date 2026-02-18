import mongoose from "mongoose";

const MONGODB_URI = process.env.Mongo_URI;

if (!mongoose.connection.readyState) {
    mongoose.connect(MONGODB_URI);
}

export default mongoose;


