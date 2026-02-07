// src/routes/userRoutes.ts

import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth';
import { 
  getProfile, 
  updateProfile, 
  searchMembers, 
  sendFriendRequest, 
  acceptFriendRequest,
  markNotificationsRead, // Added for the Dashboard bell
  updateProfilePicture   // Added for the Profile Tab
} from '../controllers/userController';

const router = express.Router();

/**
 * MULTER CONFIGURATION
 * We use memoryStorage or a temp 'uploads' folder to hold the 
 * image briefly before sending it to Cloudinary.
 */
const upload = multer({ dest: 'uploads/' });

// --- PROFILE ROUTES ---
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

// This route handles the profile picture upload to Cloudinary
router.post('/profile-picture', auth, upload.single('image'), updateProfilePicture);

// --- MEMBER DISCOVERY ---
router.get('/search', auth, searchMembers);

// --- SOCIAL ACTIONS ---
router.post('/request/:targetUserId', auth, sendFriendRequest);
router.post('/accept/:requesterId', auth, acceptFriendRequest);

// --- NOTIFICATIONS ---
router.patch('/notifications/read', auth, markNotificationsRead);

export default router;