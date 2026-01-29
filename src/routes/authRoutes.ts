// src/routes/authRoutes.ts

import express from 'express';
import { register, login } from '../controllers/authController';
import auth from '../middleware/auth';
import { getProfile, updateProfile } from '../controllers/userController';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', login);

// Protected route: Returns current user data based on the token
router.get('/me', auth, (req: any, res) => {
  res.status(200).json(req.user);
});

// User profile routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

export default router;