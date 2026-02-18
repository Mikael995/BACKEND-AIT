// src/controllers/userController.ts

import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcryptjs';

/**
 * HELPER: Map numeric levels to human-readable badges
 */
const getRoleLabel = (level: number): string => {
  if (level >= 6) return 'Owner';
  if (level === 5) return 'Administrator';
  if (level === 4) return 'Moderator';
  if (level === 3) return 'Member III';
  if (level === 2) return 'Member II';
  return 'Member';
};

/**
 * 1. Get current user's full profile
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id)
      .select('-password')
      .populate('connections', 'firstName lastName profileImage city level');
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // Attach role label to the main user and all connections
    const userObj = user.toObject();
    const profile = {
      ...userObj,
      roleLabel: getRoleLabel(user.level),
      connections: userObj.connections.map((c: any) => ({
        ...c,
        roleLabel: getRoleLabel(c.level)
      }))
    };

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

/**
 * 2. Update user profile details
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };
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
 * Returns friend status so the UI knows which button to show
 */
export const searchMembers = async (req: AuthRequest, res: Response) => {
  const query = req.query.query as string;
  const currentUserId = req.user?.id;
  
  if (!query) return res.status(200).json([]);

  try {
    const currentUser = await User.findById(currentUserId).select('connections friendRequestsSent friendRequestsReceived');
    
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { isActive: { $ne: false } }, // Only search active users
        {
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { city: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('firstName lastName city profileImage level');

    const formattedUsers = users.map(u => {
      const uObj = u.toObject();
      let connectionStatus = 'none'; // Default

      if (currentUser?.connections.includes(u._id)) connectionStatus = 'connected';
      else if (currentUser?.friendRequestsSent.includes(u._id)) connectionStatus = 'pending_sent';
      else if (currentUser?.friendRequestsReceived.includes(u._id)) connectionStatus = 'pending_received';

      return {
        ...uObj,
        roleLabel: getRoleLabel(u.level),
        connectionStatus
      };
    });
    
    res.status(200).json(formattedUsers);
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

    // Update current user
    await User.findByIdAndUpdate(currentUserId, { 
      $addToSet: { connections: requesterId },
      $pull: { friendRequestsReceived: requesterId }
    });
    
    // Update requester
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
 * 7. Update Profile Picture
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
 * 9. Deactivate Account
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
 * 10. Delete Account
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndDelete(req.user?.id);
    res.status(200).json({ message: "Account permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete account" });
  }
};


// Add this inside src/controllers/userController.ts
export const addSystemNotification = async (userId: string, message: string) => {
  await User.findByIdAndUpdate(userId, {
    $push: {
      notifications: {
        type: 'system',
        message,
        read: false,
        createdAt: new Date()
      }
    }
  });
};