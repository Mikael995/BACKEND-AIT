// src/controllers/userController.ts

import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcryptjs';

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
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params; 
    const currentUserId = req.user?.id;
    
    const isObjectId = mongoose.Types.ObjectId.isValid(userId || "");
    const query = userId 
      ? (isObjectId ? { _id: userId } : { username: userId }) 
      : { _id: currentUserId };

    const user = await User.findOne(query)
      .select('-password')
      .populate('connections', 'firstName lastName profileImage city level username')
      .populate('notifications.relatedUser', 'firstName lastName profileImage username');
    
    if (!user) return res.status(404).json({ message: "User not found" });

    const targetIdStr = user._id.toString();
    let connectionStatus = 'none';
    
    if (currentUserId && targetIdStr !== currentUserId.toString()) {
      const currentUser = await User.findById(currentUserId);
      const connections = currentUser?.connections.map(id => id.toString()) || [];
      const sentRequests = currentUser?.friendRequestsSent.map(id => id.toString()) || [];
      const receivedRequests = currentUser?.friendRequestsReceived.map(id => id.toString()) || [];

      if (connections.includes(targetIdStr)) connectionStatus = 'connected';
      else if (sentRequests.includes(targetIdStr)) connectionStatus = 'pending_sent';
      else if (receivedRequests.includes(targetIdStr)) connectionStatus = 'pending_received';
    } else {
      connectionStatus = 'self';
    }

    const userObj = user.toObject();
    
    // Sort and filter out notifications from users that no longer exist
    const cleanNotifications = (userObj.notifications || [])
      .filter((n: any) => n.relatedUser !== null)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const profile = {
      ...userObj,
      roleLabel: getRoleLabel(user.level),
      connectionStatus,
      isOwnProfile: targetIdStr === currentUserId?.toString(),
      connections: (userObj.connections || []).map((c: any) => ({
        ...c,
        roleLabel: getRoleLabel(c.level)
      })),
      notifications: cleanNotifications
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

/**
 * 2. Update Profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };
    const restricted = ['level', 'password', 'email', 'isActive', 'connections', 'friendRequestsSent', 'friendRequestsReceived'];
    restricted.forEach(f => delete updates[f]);

    const updatedUser = await User.findByIdAndUpdate(req.user?.id, updates, { new: true }).select('-password');
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
        { $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { city: { $regex: query, $options: 'i' } }
        ]}
      ]
    }).select('firstName lastName city profileImage level').limit(10);

    const connections = currentUser?.connections.map(id => id.toString()) || [];
    const sent = currentUser?.friendRequestsSent.map(id => id.toString()) || [];
    const received = currentUser?.friendRequestsReceived.map(id => id.toString()) || [];

    const formattedUsers = users.map(u => {
      const uIdStr = u._id.toString();
      let status = 'none';
      if (connections.includes(uIdStr)) status = 'connected';
      else if (sent.includes(uIdStr)) status = 'pending_sent';
      else if (received.includes(uIdStr)) status = 'pending_received';

      return { ...u.toObject(), roleLabel: getRoleLabel(u.level), connectionStatus: status };
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
  if (targetUserId === currentUserId) return res.status(400).json({ message: "Cannot add yourself" });

  try {
    const sender = await User.findById(currentUserId);
    const recipient = await User.findById(targetUserId);
    if (!sender || !recipient) return res.status(404).json({ message: "User not found" });

    if (sender.connections.includes(targetUserId as any)) return res.status(400).json({ message: "Already connected" });
    if (sender.friendRequestsSent.includes(targetUserId as any)) return res.status(400).json({ message: "Request already pending" });

    await User.findByIdAndUpdate(targetUserId, { 
      $addToSet: { friendRequestsReceived: currentUserId },
      $push: { notifications: {
        type: 'friend_request',
        message: `${sender.firstName} ${sender.lastName} sent you a friend request.`,
        relatedUser: currentUserId,
        read: false,
        createdAt: new Date()
      }} 
    });

    await User.findByIdAndUpdate(currentUserId, { $addToSet: { friendRequestsSent: targetUserId } });
    res.status(200).json({ message: "Request sent" });
  } catch (error) {
    res.status(500).json({ message: "Action failed" });
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
    const requester = await User.findById(requesterId);

    if (!requester) {
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { friendRequestsReceived: requesterId, notifications: { relatedUser: requesterId } }
      });
      return res.status(404).json({ message: "User no longer exists" });
    }

    // Update acceptor
    await User.findByIdAndUpdate(currentUserId, { 
      $addToSet: { connections: requesterId },
      $pull: { 
        friendRequestsReceived: requesterId, 
        notifications: { relatedUser: requesterId, type: 'friend_request' } 
      }
    });
    
    // Update requester
    await User.findByIdAndUpdate(requesterId, { 
      $addToSet: { connections: currentUserId },
      $pull: { friendRequestsSent: currentUserId },
      $push: { notifications: {
        type: 'system',
        message: `You are now connected with ${acceptor?.firstName}!`,
        relatedUser: currentUserId,
        read: false,
        createdAt: new Date()
      }}
    });

    res.status(200).json({ message: "Connected" });
  } catch (error) {
    res.status(500).json({ message: "Acceptance failed" });
  }
};

/**
 * 6. Get Pending Requests
 */
export const getPendingRequests = async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user.id).populate("friendRequestsReceived", "firstName lastName profileImage city connections");
    if (!user) return res.status(404).json({ message: "User not found" });

    const validRequests = user.friendRequestsReceived.filter((r: any) => r && !user.connections.includes(r._id));
    if (validRequests.length !== user.friendRequestsReceived.length) {
      user.friendRequestsReceived = validRequests.map((r: any) => r._id);
      await user.save();
    }
    res.status(200).json(validRequests);
  } catch (error) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

/**
 * 7. Decline Friend Request
 */
export const declineFriendRequest = async (req: AuthRequest, res: Response) => {
  const { requesterId } = req.params;
  const currentUserId = req.user?.id;
  try {
    await User.findByIdAndUpdate(currentUserId, { 
      $pull: { 
        friendRequestsReceived: requesterId,
        notifications: { relatedUser: requesterId, type: 'friend_request' }
      }
    });
    await User.findByIdAndUpdate(requesterId, { $pull: { friendRequestsSent: currentUserId } });
    res.status(200).json({ message: "Declined" });
  } catch (error) {
    res.status(500).json({ message: "Failed" });
  }
};

/**
 * 8. Remove Connection / Unfriend
 */
export const removeConnection = async (req: AuthRequest, res: Response) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user?.id;
  try {
    await User.findByIdAndUpdate(currentUserId, { $pull: { connections: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $pull: { connections: currentUserId } });
    res.status(200).json({ message: "Removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed" });
  }
};

/**
 * 9. Mark Notifications Read
 */
export const markNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user?.id, { $set: { "notifications.$[].read": true } });
    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: "Failed" });
  }
};

/**
 * 10. Update Profile Picture
 */
export const updateProfilePicture = async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ait_profiles',
      transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }]
    });
    const updated = await User.findByIdAndUpdate(req.user.id, { profileImage: result.secure_url }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed" });
  }
};

/**
 * 11. Security
 */
export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, user.password || '');
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: "Failed" });
  }
};

export const deactivateAccount = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.user?.id, { isActive: false });
    res.status(200).json({ message: "Deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Failed" });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndDelete(req.user?.id);
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed" });
  }
};