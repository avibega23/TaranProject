import mongoose from "mongoose";
import { logError, logInfo } from "../utils/logger.js";

export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri);
    logInfo("Connected to MongoDB");
  } catch (error) {
    logError("MongoDB connection failed", error);
    throw new Error(
      "Could not connect to MongoDB. Check MONGODB_URI in apps/api/.env. The API will not start without a database.",
    );
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
