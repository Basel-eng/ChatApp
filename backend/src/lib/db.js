import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("connect db");
  } catch (error) {
    console.log(error);
  }
};
