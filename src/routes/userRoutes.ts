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
  updatePassword,
  deactivateAccount,
  deleteAccount
} from '../controllers/userController';

const router = express.Router();

/**
 * MULTER CONFIGURATION
 * Files are temporarily stored in 'uploads/' before being sent to Cloudinary
 */
const upload = multer({ dest: 'uploads/' });

// --- PROFILE & ROLE ROUTES ---
// We use getProfile for the /role route because the User/Profile model 
// in MongoDB typically contains the role level info.
router.get('/profile', auth, getProfile);
router.get('/role', auth, getProfile); // Added to match useUserRole hook
router.put('/profile', auth, updateProfile);

// Matches useUploadAvatar hook: ensure hook uses formData.append('image', file)
router.post('/profile-picture', auth, upload.single('image'), updateProfilePicture);

// --- ACCOUNT MANAGEMENT ---
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