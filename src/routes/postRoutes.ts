import express from 'express';
import auth from '../middleware/auth';
import { createPost, getFeed, toggleLike } from '../controllers/postController';

const router = express.Router();

// Get the community feed
router.get('/', auth, getFeed);

// Create a new post
router.post('/', auth, createPost);

// Like/Unlike a post
router.put('/:postId/like', auth, toggleLike);

export default router;