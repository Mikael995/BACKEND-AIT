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
  markNotificationsRead,
  updateProfilePicture,
  // New Controllers for Account Management
  updatePassword,
  deactivateAccount,
  deleteAccount
} from '../controllers/userController';

const router = express.Router();

/**
 * MULTER CONFIGURATION
 */
const upload = multer({ dest: 'uploads/' });

// --- PROFILE ROUTES ---
// This handles fetching and updating text info (firstName, lastName, phone, city)
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

// This route handles the profile picture upload to Cloudinary
router.post('/profile-picture', auth, upload.single('image'), updateProfilePicture);

// --- ACCOUNT MANAGEMENT ---
// Security and account status
router.put('/profile/password', auth, updatePassword);
router.patch('/profile/deactivate', auth, deactivateAccount);
router.delete('/profile', auth, deleteAccount);

// --- MEMBER DISCOVERY ---
router.get('/search', auth, searchMembers);

// --- SOCIAL ACTIONS ---
router.post('/request/:targetUserId', auth, sendFriendRequest);
router.post('/accept/:requesterId', auth, acceptFriendRequest);

// --- NOTIFICATIONS ---
router.patch('/notifications/read', auth, markNotificationsRead);

export default router;