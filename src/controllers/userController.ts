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
 * 1. Get User Profile (Unified)
 * Handles both "Self" and "Public" profiles based on userId param
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    
    // Determine which user we are looking at
    const targetId = userId || currentUserId;

    const user = await User.findById(targetId)
      .select('-password')
      .populate('connections', 'firstName lastName profileImage city level');
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // Determine relationship status for the UI buttons
    let connectionStatus = 'none';
    if (currentUserId && String(targetId) !== String(currentUserId)) {
      const currentUser = await User.findById(currentUserId);
      
      const targetObjectId = new mongoose.Types.ObjectId(targetId);

      if (currentUser?.connections.includes(targetObjectId)) {
        connectionStatus = 'connected';
      } else if (currentUser?.friendRequestsSent.includes(targetObjectId)) {
        connectionStatus = 'pending_sent';
      } else if (currentUser?.friendRequestsReceived.includes(targetObjectId)) {
        connectionStatus = 'pending_received';
      }
    } else {
      connectionStatus = 'self';
    }

    const userObj = user.toObject();
    const profile = {
      ...userObj,
      roleLabel: getRoleLabel(user.level),
      connectionStatus,
      isOwnProfile: String(targetId) === String(currentUserId),
      connections: userObj.connections.map((c: any) => ({
        ...c,
        roleLabel: getRoleLabel(c.level)
      }))
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

/**
 * 2. Update user profile details
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };
    const restrictedFields = ['level', 'password', 'email', 'isActive', 'connections', 'friendRequestsSent', 'friendRequestsReceived'];
    restrictedFields.forEach(field => delete updates[field]);

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
 * 3. Search Members
 */
export const searchMembers = async (req: AuthRequest, res: Response) => {
  const query = req.query.query as string;
  const currentUserId = req.user?.id;
  
  if (!query) return res.status(200).json([]);

  try {
    const currentUser = await User.findById(currentUserId);
    
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { isActive: { $ne: false } },
        {
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { city: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('firstName lastName city profileImage level').limit(10);

    const formattedUsers = users.map(u => {
      let connectionStatus = 'none';
      if (currentUser?.connections.includes(u._id)) connectionStatus = 'connected';
      else if (currentUser?.friendRequestsSent.includes(u._id)) connectionStatus = 'pending_sent';
      else if (currentUser?.friendRequestsReceived.includes(u._id)) connectionStatus = 'pending_received';

      return {
        ...u.toObject(),
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
 * Now includes 'relatedUser' in notifications for frontend navigation
 */
export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user?.id;

  if (targetUserId === currentUserId) return res.status(400).json({ message: "Cannot add yourself" });

  try {
    const sender = await User.findById(currentUserId);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    const recipient = await User.findByIdAndUpdate(targetUserId, { 
      $addToSet: { 
        friendRequestsReceived: currentUserId,
        notifications: {
          type: 'friend_request',
          message: `${sender.firstName} ${sender.lastName} sent you a friend request.`,
          relatedUser: currentUserId, // Used for navigation click
          read: false,
          createdAt: new Date()
        }
      } 
    });

    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

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

    // 1. Update current user (Acceptor)
    await User.findByIdAndUpdate(currentUserId, { 
      $addToSet: { connections: requesterId },
      $pull: { friendRequestsReceived: requesterId }
    });
    
    // 2. Update requester
    await User.findByIdAndUpdate(requesterId, { 
      $addToSet: { connections: currentUserId },
      $pull: { friendRequestsSent: currentUserId },
      $push: { 
        notifications: {
          type: 'system',
          message: `You are now connected with ${acceptor.firstName}!`,
          relatedUser: currentUserId, // Navigate to the person who accepted
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
 * 6. Remove Connection (Unfriend)
 */
export const removeConnection = async (req: AuthRequest, res: Response) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user?.id;

  try {
    await User.findByIdAndUpdate(currentUserId, { $pull: { connections: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $pull: { connections: currentUserId } });
    res.status(200).json({ message: "Connection removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove connection" });
  }
};

/**
 * 7. Mark Notifications as Read
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
 * 8. Update Profile Picture
 */
export const updateProfilePicture = async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image provided" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ait_profiles',
      transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }]
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
 * 9. Security & Account Management
 */
export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user || !user.password) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update password" });
  }
};

export const deactivateAccount = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user?.id, { isActive: false });
    res.status(200).json({ message: "Account deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate" });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndDelete(req.user?.id);
    res.status(200).json({ message: "Account permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete" });
  }
};