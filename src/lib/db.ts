// src/lib/db.ts
import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://sayd:cotedivoire@ait.scqmido.mongodb.net/AIT?retryWrites=true&w=majority";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;
    
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected to AIT Cluster");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};