import { Request, Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Event from '../models/Event';
import System from '../models/System';
import jwt from 'jsonwebtoken';
import { sendAITVerificationEmail, sendAITPasswordResetEmail } from '../lib/mailer'; // FIX: Names matched
import BannedIP from '../models/BannedIP';
import crypto from 'crypto';

// 1. Get Stats (Level 4+)
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const usersByLevel = await User.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } }
    ]);

    const totalPosts = await Post.countDocuments();
    const totalEvents = await Event.countDocuments();
    
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email level profileImage');
    const upcomingEvents = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5);

    res.status(200).json({
      summary: {
        totalUsers,
        verifiedUsers,
        totalPosts,
        totalEvents,
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0
      },
      usersByLevel,
      recentUsers,
      upcomingEvents
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin statistics" });
  }
};

// 2. Change Roles (Level 6)
export const updateUserLevel = async (req: Request, res: Response) => {
  const { userId, newLevel } = req.body;
  try {
    const user = await User.findByIdAndUpdate(userId, { level: newLevel }, { new: true });
    res.status(200).json({ message: `User level updated to ${newLevel}`, user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user level" });
  }
};

// 3. Delete User (Level 6)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    await Post.deleteMany({ author: userId });
    res.status(200).json({ message: "User and related data purged." });
  } catch (error) {
    res.status(500).json({ message: "Deletion failed" });
  }
};

// 4. Ghost Login (Level 6)
export const ghostLogin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign(
      { id: user._id, level: user.level }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Ghost login failed" });
  }
};

// 5. Resend Verification (Level 5+)
export const resendUserVerification = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendAITVerificationEmail(user.email, user.firstName, token);
    res.status(200).json({ message: "Verification email sent." });
  } catch (error) {
    res.status(500).json({ message: "Email failed" });
  }
};

// 6. Manual Reset Trigger (Level 5+)
export const triggerPasswordReset = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString('hex');
    
    // These will now work because of the Model update!
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await sendAITPasswordResetEmail(user.email, token);
    res.status(200).json({ message: "Password reset link sent to user." });
  } catch (error) {
    res.status(500).json({ message: "Reset link failed" });
  }
};

// 7. Ban User IP (Level 6+)
export const banUserIP = async (req: Request, res: Response) => {
  try {
    const { userId, reason } = req.body;
    const user = await User.findById(userId);
    
    if (!user || !user.lastKnownIP) {
      return res.status(404).json({ message: "User or IP not found" });
    }

    // 1. Add IP to blacklist
    await BannedIP.create({
      ip: user.lastKnownIP,
      reason: reason || "Disruptive behavior",
      adminId: (req as any).user.id
    });

    // 2. Optional: Delete or Deactivate the user account
    user.level = 0; // Or delete them entirely
    await user.save();

    res.status(200).json({ message: `IP ${user.lastKnownIP} has been blacklisted.` });
  } catch (error) {
    res.status(500).json({ message: "IP Ban failed" });
  }
};

// @desc    Get system status
// @route   GET /api/admin/system-status
export const getSystemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find the first document in the system collection
    let status = await System.findOne();
    
    // If it doesn't exist, create the default "Operational" state
    if (!status) {
      status = await System.create({ maintenance: false });
    }
    
    res.status(200).json(status);
  } catch (error) {
    console.error("Status Fetch Error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Update system status (Maintenance Toggle)
// @route   PATCH /api/admin/system-status
export const updateSystemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { maintenance } = req.body;
    
    // Use findOneAndUpdate with upsert: true. 
    // This looks for ANY document ({}) and updates it, or creates it if it's missing.
    const status = await System.findOneAndUpdate(
      {}, 
      { 
        maintenance, 
        lastUpdatedBy: (req as any).user?._id // Cast req to any to access the user ID
      },
      { new: true, upsert: true }
    );

    res.status(200).json(status);
  } catch (error) {
    console.error("Protocol Update Error:", error);
    res.status(500).json({ message: 'Protocol Update Failed' });
  }
};