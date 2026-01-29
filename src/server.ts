// src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { v2 as cloudinary } from 'cloudinary';
import authRoutes from './routes/authRoutes'; 

dotenv.config();

const app = express();

// --- 1. Configurations ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const resend = new Resend(process.env.RESEND_API_KEY);

// --- 2. Middleware ---
app.use(cors());
app.use(express.json());

// --- 3. Database Connection ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sayd:cotedivoire@ait.scqmido.mongodb.net/AIT?retryWrites=true&w=majority';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Connected to AIT MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// --- 4. Routes ---

// Health Check
app.get('/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({
    status: "active",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    port: 5000 
  });
});

// Root
app.get('/', (req: Request, res: Response) => {
  res.send('AIT Backend API is running on Port 5000');
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// --- 5. Global Error Handling ---
// Note: Ensure all 4 parameters are present to prevent "next is not a function" errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('SERVER_ERROR:', err.stack || err);
  res.status(err.status || 500).json({ 
    message: 'Something went wrong on the server',
    error: err.message || 'Internal Server Error'
  });
});

// --- 6. Start Server ---
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`
  🚀 Server is live on Port 5000!
  📡 URL: http://localhost:5000
  🏥 Health: http://localhost:5000/health
  🔐 Signup Test (POST): http://localhost:5000/api/auth/signup
  `);
});