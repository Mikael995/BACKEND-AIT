// src/controllers/userController.ts

import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcryptjs';

/**
 * 1. Get current user's full profile
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id)
      .select('-password')
      .populate('connections', 'firstName lastName profileImage city');
    
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

/**
 * 2. Update user profile details (Name, Phone, City)
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };
    // Safety: prevent manual overrides of sensitive fields
    delete updates.level;
    delete updates.password;
    delete updates.email;
    delete updates.isActive;

    const updatedUser = await User.findByIdAndUpdate(
      req.user?.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

/**
 * 3. Search Members by Name or City
 */
export const searchMembers = async (req: AuthRequest, res: Response) => {
  const query = req.query.query as string;
  
  if (!query) {
    return res.status(200).json([]);
  }

  try {
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user?.id } },
        {
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { city: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('firstName lastName city profileImage level');
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};

/**
 * 4. Send Friend Request
 */
export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user?.id;

  if (targetUserId === currentUserId) {
    return res.status(400).json({ message: "You cannot add yourself" });
  }

  try {
    const sender = await User.findById(currentUserId);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    const recipient = await User.findByIdAndUpdate(targetUserId, { 
      $addToSet: { 
        friendRequestsReceived: currentUserId,
        notifications: {
          type: 'friend_request',
          message: `${sender.firstName} sent you a friend request.`,
          senderId: currentUserId,
          read: false,
          createdAt: new Date()
        }
      } 
    });

    if (!recipient) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndUpdate(currentUserId, { 
      $addToSet: { friendRequestsSent: targetUserId } 
    });

    res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Could not send request" });
  }
};

/**
 * 5. Accept Friend Request
 */
export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
  const { requesterId } = req.params;
  const currentUserId = req.user?.id;

  try {
    const acceptor = await User.findById(currentUserId);
    if (!acceptor) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndUpdate(currentUserId, { 
      $addToSet: { connections: requesterId },
      $pull: { friendRequestsReceived: requesterId }
    });
    
    await User.findByIdAndUpdate(requesterId, { 
      $addToSet: { connections: currentUserId },
      $pull: { friendRequestsSent: currentUserId },
      $push: { 
        notifications: {
          type: 'system',
          message: `You are now connected with ${acceptor.firstName}!`,
          read: false,
          createdAt: new Date()
        }
      }
    });

    res.status(200).json({ message: "Connection established" });
  } catch (error) {
    res.status(500).json({ message: "Could not accept request" });
  }
};

/**
 * 6. Mark Notifications as Read
 */
export const markNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user?.id, {
      $set: { "notifications.$[].read": true }
    });
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
};

/**
 * 7. Update Profile Picture (Cloudinary)
 */
export const updateProfilePicture = async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image provided" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ait_profiles',
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: result.secure_url },
      { new: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Image upload failed" });
  }
};

/**
 * 8. Modify Password
 */
export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update password" });
  }
};

/**
 * 9. Deactivate Account (Soft Delete)
 */
export const deactivateAccount = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user?.id, { isActive: false });
    res.status(200).json({ message: "Account deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate account" });
  }
};

/**
 * 10. Delete Account (Permanent)
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndDelete(req.user?.id);
    res.status(200).json({ message: "Account permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete account" });
  }
};