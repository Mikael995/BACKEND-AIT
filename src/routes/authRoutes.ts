// src/routes/authRoutes.ts

// src/routes/authRoutes.ts

import express from 'express';
import { 
  register, 
  login, 
  verifyEmail, 
  resendVerification // Added this import
} from '../controllers/authController';
import auth from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user & send verification email
 * @access  Public
 */
router.post('/signup', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify user email via token link
 * @access  Public
 */
router.get('/verify-email', verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Request a new verification email
 * @access  Public (or Private depending on if user is logged in)
 */
router.post('/resend-verification', resendVerification);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile (latest data)
 * @access  Private
 */
router.get('/me', auth, async (req: any, res) => {
  try {
    // We fetch from DB to ensure 'level' and 'isVerified' are up to date
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching user data" });
  }
});

export default router;