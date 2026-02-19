// src/models/User.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string; // Added for cleaner public profile URLs
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone: string;
  city: string;
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  profileImage: string;
  bio?: string;
  // VERIFICATION FIELDS
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastKnownIP?: string;
  // SOCIAL CORE
  connections: mongoose.Types.ObjectId[];
  friendRequestsSent: mongoose.Types.ObjectId[];
  friendRequestsReceived: mongoose.Types.ObjectId[];
  interests: string[];
  isSubscribedToNews: boolean;
  notifications: Array<{
    type: 'friend_request' | 'post_like' | 'post_comment' | 'system' | 'email_verification';
    message: string;
    relatedUser?: mongoose.Types.ObjectId; // Changed from senderId for better frontend mapping
    read: boolean;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  // Username: Unique, lowercase, and trimmed for clean URLs (e.g., ait.com/p/junior.kissi)
  username: { 
    type: String, 
    unique: true, 
    sparse: true, 
    lowercase: true, 
    trim: true,
    index: true 
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  level: { type: Number, enum: [1, 2, 3, 4, 5, 6], default: 1 },
  isVerified: { type: Boolean, default: false },
  lastKnownIP: { type: String },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
profileImage: { 
  type: String, 
  default: 'https://ivoriansintexas.com/default.png' 
},
  bio: { type: String, maxlength: 500 },
  connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsSent: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsReceived: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  interests: [{ type: String }],
  isSubscribedToNews: { type: Boolean, default: true },
  notifications: [{
    type: { 
      type: String, 
      enum: ['friend_request', 'post_like', 'post_comment', 'system', 'email_verification'], 
      default: 'system' 
    },
    message: { type: String, required: true },
    // Using relatedUser to store the ID of the person sending the request
    relatedUser: { type: Schema.Types.ObjectId, ref: 'User' }, 
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Pre-save hook to generate username if it doesn't exist
UserSchema.pre('save', async function (next) {
  if (this.isNew && !this.username) {
    const base = `${this.firstName}.${this.lastName}`.toLowerCase().replace(/\s+/g, '');
    const random = Math.floor(100 + Math.random() * 900);
    this.username = `${base}${random}`;
  }
  next();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;