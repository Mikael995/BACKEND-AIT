import express from 'express';
import auth from '../middleware/auth';
import { checkLevel } from '../middleware/checkLevel';
import { 
  getAdminStats, 
  updateUserLevel, 
  deleteUser, 
  ghostLogin, 
  resendUserVerification,
  triggerPasswordReset 
} from '../controllers/adminController';

const router = express.Router();

router.get('/stats', auth, checkLevel(4), getAdminStats);
router.post('/resend-verification', auth, checkLevel(5), resendUserVerification);
router.post('/trigger-reset', auth, checkLevel(5), triggerPasswordReset);
router.patch('/update-role', auth, checkLevel(6), updateUserLevel);
router.delete('/user/:userId', auth, checkLevel(6), deleteUser);
router.post('/ghost-login', auth, checkLevel(6), ghostLogin);

export default router;