import express from 'express';
import { 
  register, 
  login, 
  verifyEmail, 
  resendVerification,
  resetPassword
} from '../controllers/authController';
import { getUserProfile } from '../controllers/userController'; // Import the unified controller
import auth from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 */
router.post('/signup', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify user email via token link (Update this to match your frontend link)
 */
router.get('/verify-email', verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Request a new verification email
 */
router.post('/resend-verification', resendVerification);
router.post('/reset-password', resetPassword);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile with full social data
 * @access  Private
 */
// By calling getUserProfile without a userId param, 
// it defaults to the logged-in user's ID from the 'auth' middleware.
router.get('/me', auth, getUserProfile);

export default router;