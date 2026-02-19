// src/server.ts
import dotenv from 'dotenv';
dotenv.config(); 

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs'; // Added for directory check
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

// Route Imports
import authRoutes from './routes/authRoutes'; 
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import eventRoutes from './routes/eventRoutes';
import adminRoutes from './routes/adminRoutes';
import { checkIP } from './middleware/checkIP';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. Configurations ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure 'uploads' directory exists for Multer
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// --- 2. Middleware ---
app.use(cors());
app.use(express.json());
app.use(checkIP);
// Serve uploads folder statically (just in case)
app.use('/uploads', express.static(uploadDir));

// --- 3. Database Connection ---
const MONGO_URI = process.env.MONGO_URI || 'your_fallback_uri';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Connected to AIT MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// --- 4. API Routes ---
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: "active",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/posts', postRoutes); 
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// --- 5. Frontend Integration ---
// if (process.env.NODE_ENV === 'production') {
//   const distPath = path.join(__dirname, '../dist');
//   app.use(express.static(distPath));
//   app.get('*', (req: Request, res: Response) => {
//     res.sendFile(path.join(distPath, 'index.html'));
//   });
// }

// --- 6. Error Handling ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('SERVER_ERROR:', err.stack || err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5001; 
app.listen(PORT, () => {
  console.log(`🚀 Server live on Port ${PORT}`);
});