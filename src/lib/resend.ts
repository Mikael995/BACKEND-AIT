// src/lib/resend.ts

import { Resend } from "resend";
import dotenv from "dotenv";

// Ensure env is loaded before initializing
dotenv.config();

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY is missing from environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;