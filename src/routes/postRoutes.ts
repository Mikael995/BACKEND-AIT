// src/routes/postRoutes.ts
import express from 'express';
import auth from '../middleware/auth';
import { 
  createPost, 
  getFeed, 
  toggleLike, 
  deletePost, 
  addComment 
} from '../controllers/postController';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// --- Multer Configuration ---
// Setting up storage so images keep their extensions during the temporary local save
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

// 1. Get all posts for the feed (Newest first handled in controller)
router.get('/', auth, getFeed);

// 2. Create a new post (Supports single image upload with field name 'image')
router.post('/', auth, upload.single('image'), createPost);

// 3. Like/Unlike a post
router.put('/:postId/like', auth, toggleLike);

// 4. Add a comment to a post
router.post('/:postId/comment', auth, addComment);

// 5. Delete a post (Controller handles ownership check)
router.delete('/:postId', auth, deletePost);

export default router;