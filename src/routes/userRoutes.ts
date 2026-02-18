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
 * Storage engine for profile pictures. 
 * Note: Use 'image' as the field name in your Frontend FormData.
 */
const upload = multer({ dest: 'uploads/' });

// --- 1. PROFILE & IDENTITY ---
// Returns the full user object including the new 'roleLabel'
router.get('/profile', auth, getProfile);

// Explicit route for the useUserRole hook
// This ensures compatibility with the @tanstack/react-query logic
router.get('/role', auth, getProfile); 

router.put('/profile', auth, updateProfile);

// Profile Picture - matches useUploadAvatar hook
router.post('/profile-picture', auth, upload.single('image'), updateProfilePicture);


// --- 2. SOCIAL & NETWORKING ---
// Search members by name or city (Returns connectionStatus & roleLabel)
router.get('/search', auth, searchMembers);

// Friend Request Flow
router.post('/request/:targetUserId', auth, sendFriendRequest);
router.post('/accept/:requesterId', auth, acceptFriendRequest);

/**
 * NOTE: If you add a declineFriendRequest function to userController later, 
 * you should map it to: router.post('/decline/:requesterId', auth, declineFriendRequest);
 */


// --- 3. NOTIFICATIONS ---
router.patch('/notifications/read', auth, markNotificationsRead);


// --- 4. ACCOUNT SECURITY & PRIVACY ---
router.put('/profile/password', auth, updatePassword);

// Soft Delete (Disable account)
router.patch('/profile/deactivate', auth, deactivateAccount);

// Hard Delete (Remove from DB)
router.delete('/profile', auth, deleteAccount);

export default router;