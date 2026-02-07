import { Response } from 'express';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';

// Create a new post
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, image, location } = req.body;
    const newPost = new Post({
      author: req.user?.id,
      content,
      image,
      location
    });
    await newPost.save();
    
    // Return populated author so frontend can show the name immediately
    const populatedPost = await newPost.populate('author', 'firstName lastName profileImage city');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: "Failed to create post" });
  }
};

// Get the feed (all posts from all members)
export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find()
      .populate('author', 'firstName lastName profileImage city')
      .sort({ createdAt: -1 }); // Newest first
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feed" });
  }
};

// Like/Unlike toggle
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user?.id as any;
    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Action failed" });
  }
};