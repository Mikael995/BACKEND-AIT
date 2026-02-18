// src/lib/resend.ts
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// This line will now prioritize your NEW key from the .env file
const KEY_TO_USE = process.env.RESEND_API_KEY; 

if (!KEY_TO_USE) {
  console.error("❌ ERROR: RESEND_API_KEY is missing from your .env file.");
} else {
  // This will show you which key is actually being used
  console.log(`✅ Attempting Resend with Key: ${KEY_TO_USE.substring(0, 10)}...`);
}

const resend = new Resend(KEY_TO_USE as string);

export default resend;