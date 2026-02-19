import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth';
import { 
  getUserProfile, // Renamed from getProfile to match the new unified logic
  updateProfile, 
  searchMembers, 
  sendFriendRequest, 
  acceptFriendRequest,
  removeConnection, // Added for "Unfriend" functionality
  markNotificationsRead,
  updateProfilePicture,
  updatePassword,
  deactivateAccount,
  deleteAccount
} from '../controllers/userController';

const router = express.Router();

/**
 * MULTER CONFIGURATION
 */
const upload = multer({ dest: 'uploads/' });

// --- 1. PROFILE & IDENTITY ---

// Unified Profile Route: 
// GET /user/profile -> Returns logged-in user profile
// GET /user/profile/:userId -> Returns a specific user's public profile
router.get('/profile/:userId?', auth, getUserProfile);

// Explicit route for hooks that specifically check the logged-in role
router.get('/role', auth, getUserProfile); 

router.put('/profile', auth, updateProfile);

// Profile Picture
router.post('/profile-picture', auth, upload.single('image'), updateProfilePicture);


// --- 2. SOCIAL & NETWORKING ---

// Search members by name or city
router.get('/search', auth, searchMembers);

// Friend Request Flow
router.post('/request/:targetUserId', auth, sendFriendRequest);
router.post('/accept/:requesterId', auth, acceptFriendRequest);

// Unfriend / Remove Connection
// This allows users to manage their network directly from a profile page
router.delete('/connection/:targetUserId', auth, removeConnection);


// --- 3. NOTIFICATIONS ---

// Mark all as read when opening the notification bell
router.patch('/notifications/read', auth, markNotificationsRead);


// --- 4. ACCOUNT SECURITY & PRIVACY ---

router.put('/profile/password', auth, updatePassword);

// Soft Delete (Disable account)
router.patch('/profile/deactivate', auth, deactivateAccount);

// Hard Delete (Remove from DB)
router.delete('/profile', auth, deleteAccount);

export default router;