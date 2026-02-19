import express, { Request, Response } from 'express';
import auth from '../middleware/auth';
import Post from '../models/Post'; // Assuming your model is in this path
import { 
  createPost, 
  getFeed, 
  toggleLike, 
  deletePost, 
  addComment, 
  likeComment
} from '../controllers/postController';
import multer from 'multer';
import path from 'path';

// This extends the Express Request type to include the 'user' object from your auth middleware
interface AuthRequest extends Request {
  user?: any; 
}

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * Community Feed Routes
 */

// 1. Feed & Creation
router.get('/', auth, getFeed);
router.post('/', auth, upload.single('image'), createPost);

// 2. Likes & Interaction
router.put('/:postId/like', auth, toggleLike);
router.post('/:postId/comment', auth, addComment);
router.put('/:postId/comment/:commentId/like', auth, likeComment);

// 3. Deletion
router.delete('/:postId', auth, deletePost);

/**
 * Moderation & Reporting Routes
 */

// 4. Report a Post
// Changed 'protect' to 'auth' to match your import
router.post('/:postId/report', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    
    const post = await Post.findByIdAndUpdate(
      postId,
      { 
        $push: { 
          reports: { 
            userId: req.user?.id, // Using optional chaining for safety
            reason, 
            createdAt: new Date() 
          } 
        } 
      },
      { new: true }
    );
    
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    res.status(200).json({ message: "Report logged successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error reporting post", error: error.message });
  }
});

// 5. Dismiss Reports (Clear the flags)
router.put('/:postId/dismiss-reports', auth, async (req: AuthRequest, res: Response) => {
  try {
    // Only level 5+ should be able to dismiss
    if (req.user?.level < 5) {
      return res.status(403).json({ message: "Unauthorized for high-level moderation" });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $set: { reports: [] } }, // Wipes the reports array clean
      { new: true }
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json({ message: "Reports dismissed" });
  } catch (error: any) {
    res.status(500).json({ message: "Dismissal failed" });
  }
});

export default router;