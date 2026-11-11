import mongoose from "mongoose";

let connectionPromise;
export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!process.env.Mongo_URI) throw new Error("Mongo_URI is required for legacy MongoDB webhooks.");
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.Mongo_URI).catch(error => {
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
  return mongoose;
}

export default mongoose;



