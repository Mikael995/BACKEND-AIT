import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth';
import { 
  getUserProfile, 
  updateProfile, 
  searchMembers, 
  sendFriendRequest, 
  acceptFriendRequest,
  getPendingRequests, // Added this to match controller
  declineFriendRequest,
  removeConnection,
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

// Profile Fetching (Unified: Self or Public)
router.get('/profile/:userId?', auth, getUserProfile);

// Explicit route for role checking
router.get('/role', auth, getUserProfile); 

// Profile Updates
router.put('/profile', auth, updateProfile);
router.post('/profile-picture', auth, upload.single('image'), updateProfilePicture);


// --- 2. SOCIAL & NETWORKING ---

// Search (Placed above dynamic ID routes to avoid collisions)
router.get('/search', auth, searchMembers);

// Friend Request Flow
router.get('/requests/pending', auth, getPendingRequests); // CRITICAL: The endpoint for your dashboard list
router.post('/request/:targetUserId', auth, sendFriendRequest);
router.post('/accept/:requesterId', auth, acceptFriendRequest);
router.post('/decline/:requesterId', auth, declineFriendRequest);

// Unfriend
router.delete('/connection/:targetUserId', auth, removeConnection);


// --- 3. NOTIFICATIONS ---

router.patch('/notifications/read', auth, markNotificationsRead);


// --- 4. ACCOUNT SECURITY ---

router.put('/profile/password', auth, updatePassword);
router.patch('/profile/deactivate', auth, deactivateAccount);
router.delete('/profile', auth, deleteAccount);

export default router;