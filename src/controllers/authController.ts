// src/controllers/authController.ts

import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import resend from '../lib/resend'; // Ensure this is the default export from lib/resend
import { sendAITVerificationEmail } from '../lib/mailer'; // Ensure this is exported from lib/mailer

/**
 * REGISTER NEW USER
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone, city } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // --- ✅ FANYO Strategy: Generate Raw & Hashed Token ---
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const vTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      city,
      level: 1, 
      isVerified: false,
      verificationToken: hashedToken, // Save the hashed version
      verificationTokenExpires: vTokenExpires,
      notifications: [{
        type: 'email_verification',
        message: 'Akwaba! Please verify your email to unlock Level 2 features.',
        read: false,
        createdAt: new Date()
      }]
    });

    // Send the RAW token in the email
    await sendAITVerificationEmail(email, firstName, rawToken);

    res.status(201).json({ 
      message: "Account created! Check your email to verify.",
      user: { id: newUser._id, email: newUser.email, level: newUser.level } 
    });
  } catch (error: any) {
    console.error("Signup Error 👉", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
};

/**
 * RESEND VERIFICATION EMAIL
 */
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.isVerified) return res.status(400).json({ message: "Account is already verified." });

    // Generate new Raw & Hashed Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.verificationToken = hashedToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send the email with the Raw token
    await sendAITVerificationEmail(user.email, user.firstName, rawToken);

    res.status(200).json({ message: "A new verification link has been sent to your email!" });
  } catch (error: any) {
    console.error("Resend Error 👉", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * VERIFY EMAIL TOKEN
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: "Verification token is missing or invalid." });
    }

    // --- ✅ FANYO Strategy: Hash the incoming token to find the user ---
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    user.isVerified = true;
    user.level = 2; 
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    user.notifications.push({
      type: 'system',
      message: 'Email verified! Welcome to Level 2.',
      read: false,
      createdAt: new Date()
    });

    await user.save();
    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error: any) {
    console.error("Verification Error 👉", error);
    res.status(500).json({ error: "Verification failed." });
  }
};

/**
 * LOGIN USER
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password!);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { email: user.email, id: user._id, level: user.level },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(200).json({ 
      result: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        level: user.level,
        isVerified: user.isVerified
      }, 
      token 
    });
  } catch (error: any) {
    console.error("Login Error 👉", error);
    res.status(500).json({ error: "Login failed" });
  }
};