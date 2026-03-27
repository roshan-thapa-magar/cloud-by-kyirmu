import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  throw new Error("Please define the MONGODB_URL in your .env file");
}

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
  } catch (error) {
    console.log("Error connecting to database:", error);
  }
};
