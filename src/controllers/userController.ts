import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Get current user's full profile from DB
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// Update user profile (e.g., adding bio, changing city)
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, city } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user?.id,
      { firstName, lastName, phone, city },
      { new: true } // Returns the updated document
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};