// src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { v2 as cloudinary } from 'cloudinary';
import authRoutes from './routes/authRoutes'; 
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import eventRoutes from './routes/eventRoutes';

dotenv.config();

const app = express();

// --- Path Configuration for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// --- 4. API Routes ---

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({
    status: "active",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/posts', postRoutes); 
app.use('/api/events', eventRoutes);

// --- 5. Static Assets & Frontend Integration ---

// In Production, serve the compiled React files
if (process.env.NODE_ENV === 'production') {
  // Path to your frontend "dist" folder (Vite build output)
  const distPath = path.join(__dirname, '../dist');
  
  app.use(express.static(distPath));

  // Catch-all: Send index.html for any request that doesn't match an API route
  // This allows React Router to handle URLs like /profile or /dashboard
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development Root Route
  app.get('/', (req: Request, res: Response) => {
    res.send('AIT Backend API is running. Switch to Frontend Port for UI.');
  });
}

// --- 6. Global Error Handling ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('SERVER_ERROR:', err.stack || err);
  res.status(err.status || 500).json({ 
    message: 'Something went wrong on the server',
    error: err.message || 'Internal Server Error'
  });
});

// --- 7. Start Server ---
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`
  🚀 Server is live on Port ${PORT}!
  📡 Environment: ${process.env.NODE_ENV || 'development'}
  🏥 Health: http://localhost:${PORT}/api/health
  `);
});