// src/models/User.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone: string;
  city: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  profileImage: string;
  bio?: string;
  // SOCIAL CORE
  connections: mongoose.Types.ObjectId[];
  friendRequestsSent: mongoose.Types.ObjectId[];
  friendRequestsReceived: mongoose.Types.ObjectId[];
  interests: string[];
  isSubscribedToNews: boolean;
  notifications: Array<{
    type: 'friend_request' | 'post_like' | 'post_comment' | 'system';
    message: string;
    senderId?: mongoose.Types.ObjectId;
    read: boolean;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  level: { 
    type: Number, 
    enum: [1, 2, 3, 4, 5, 6], 
    default: 1 
  },
  profileImage: { 
    type: String, 
    default: 'https://res.cloudinary.com/dfhlqlrco/image/upload/v1/defaults/placeholder.png' 
  },
  bio: { type: String, maxlength: 500 },
  
  // SOCIAL RELATIONSHIPS
  connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsSent: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsReceived: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  interests: [{ type: String }],
  isSubscribedToNews: { type: Boolean, default: true },
  notifications: [{
    type: { 
      type: String, 
      enum: ['friend_request', 'post_like', 'post_comment', 'system'], 
      default: 'system' 
    },
    message: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true 
});



// Middleware
UserSchema.pre('save', function(this: IUser, next: (err?: mongoose.CallbackError) => void) {
  if (this.isNew && this.level === 6) {
    console.log("Creating Owner account for AIT...");
  }
  next();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;