// src/routes/authRoutes.ts

import express from 'express';
import { register, login } from '../controllers/authController';
import auth from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/signup', register);
router.post('/login', login);

// Basic token check
router.get('/me', auth, (req: any, res) => {
  res.status(200).json(req.user);
});

export default router;