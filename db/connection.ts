import mongoose from "mongoose";
import config from "../config/env";

export const connectToDatabase = async () => {
  console.log("Connecting to MongoDB...");
  console.log(config.mongoUri);
  if (!config.mongoUri) {
    throw new Error("Missing MongoDB connection string");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(config.mongoUri, {
    autoIndex: config.env !== "production",
  });

  console.log("✅ Connected to MongoDB");
};

export const disconnectFromDatabase = async () => {
  await mongoose.disconnect();
};

