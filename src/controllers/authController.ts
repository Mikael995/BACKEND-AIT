// src/controllers/authController.ts

import { Request, Response } from 'express';
import User from '../models/User'; // Added .js for ESM compatibility
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone, city } = req.body;

    // 1. Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create User (Default Level 1)
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      city,
      level: 1
    });

    // 4. Send Welcome Email via Resend
    // Initialized here to ensure process.env.RESEND_API_KEY is loaded
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'AIT Community <onboarding@resend.dev>', // Use this sender until your domain is verified
      to: email,
      subject: 'Welcome to AIT Family!',
      html: `<h1>Akwaba, ${firstName}!</h1><p>Welcome to the Association des Ivoiriens au Texas.</p>`
    });

    res.status(201).json({ 
      message: "User registered successfully",
      user: { id: newUser._id, email: newUser.email, level: newUser.level } 
    });
  } catch (error: any) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password for comparison
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    // Create Token with the Level included
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
        level: user.level
      }, 
      token 
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};