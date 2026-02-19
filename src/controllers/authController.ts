// src/controllers/authController.ts

// src/controllers/authController.ts

import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendAITVerificationEmail } from '../lib/mailer';

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

    // --- 👇 ADDED: Generate Username here for immediate use ---
    const baseUsername = `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const username = `${baseUsername}${randomSuffix}`;

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // --- ✅ FANYO Strategy: Generate Raw & Hashed Token ---
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const vTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    const newUser = await User.create({
      username,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      city,
      level: 1, 
      isVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpires: vTokenExpires,
      notifications: [{
        type: 'email_verification',
        message: 'Akwaba! Please verify your email to unlock Level 2 features.',
        read: false,
        createdAt: new Date()
      }]
    });

    // --- 👇 UPDATED: Check for Mailer Errors ---
    const emailResult = await sendAITVerificationEmail(email, firstName, rawToken);

    if (emailResult.error) {
      console.error("Resend Error during Registration:", emailResult.error);
      // We still created the user, but we notify them that the email failed
      return res.status(201).json({ 
        message: "Account created, but verification email failed to send. Please use the 'Resend' button in your dashboard.",
        user: { id: newUser._id, email: newUser.email, level: newUser.level },
        emailError: true 
      });
    }

   res.status(201).json({ 
      message: "Account created! Check your email to verify.",
      user: { 
        id: newUser._id, 
        email: newUser.email, 
        level: newUser.level,
        username: newUser.username // Added this
      } 
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

    // --- 👇 UPDATED: Strict Error Handling ---
    const emailResult = await sendAITVerificationEmail(user.email, user.firstName, rawToken);

    if (emailResult.error) {
      console.error("Resend API rejected the request:", emailResult.error);
      
      // Map Resend error to clear message
      const errorMsg = emailResult.error.message || "Email service error";
      
      return res.status(401).json({ 
        message: `Email failed: ${errorMsg}. Please check if the API key is valid.` 
      });
    }

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

    // SAVE THE IP ADDRESS
    user.lastKnownIP = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    await user.save();

   res.status(200).json({ 
      result: {
        id: user._id,
        username: user.username, // Added this
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


/**
 * RESET PASSWORD
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // Check if not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ message: "Password updated successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Server error during password reset." });
  }
};


