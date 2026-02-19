// src/controllers/postController.ts

import { Response } from 'express';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import cloudinary from '../config/cloudinary';
import fs from 'fs'; // Required for cleaning up the uploads folder

// 1. Create a new post (with Image Support & Auto-Cleanup)
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, location } = req.body;
    let imageUrl = '';

    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'community_posts',
      });
      imageUrl = result.secure_url;

      // SUCCESS CLEANUP: Delete the temp file from /uploads so your server stays clean
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    const newPost = new Post({
      author: req.user?.id,
      content,
      image: imageUrl,
      location: location || 'Texas'
    });

    await newPost.save();
    const populatedPost = await newPost.populate('author', 'firstName lastName profileImage city');
    res.status(201).json(populatedPost);
  } catch (error) {
    // ERROR CLEANUP: Even if it fails, don't leave the file hanging in /uploads
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Create Post Error:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// 2. Get the Community Feed (All posts)
export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find()
      .populate('author', 'firstName lastName profileImage city')
      .populate('comments.user', 'firstName lastName profileImage')
      .sort({ createdAt: -1 }); // Newest first
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feed" });
  }
};

// 3. Like/Unlike Toggle
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user?.id;
    const index = post.likes.indexOf(userId as any);

    if (index === -1) {
      post.likes.push(userId as any);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Action failed" });
  }
};

// 4. Delete Post (Ownership Check)
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Ensure only the author can delete
    if (post.author.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// 5. Add Comment
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      user: req.user?.id,
      text,
      createdAt: new Date()
    };

    post.comments.push(comment as any);
    await post.save();
    
    // Return post with fully populated comments so the UI updates with the user's name/avatar
    const updatedPost = await Post.findById(post._id)
      .populate('author', 'firstName lastName profileImage city')
      .populate('comments.user', 'firstName lastName profileImage');

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Comment failed" });
  }
};