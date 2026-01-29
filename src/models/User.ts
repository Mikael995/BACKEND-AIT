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
  connections: mongoose.Types.ObjectId[];
  interests: string[];
  isSubscribedToNews: boolean;
  notifications: Array<{
    message: string;
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
  connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  interests: [{ type: String }],
  isSubscribedToNews: { type: Boolean, default: true },
  notifications: [{
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true 
});

// FIXED MIDDLEWARE: Using the built-in 'any' or '(err?: Error) => void' for next
// This avoids the missing named export issue.
UserSchema.pre('save', function(this: IUser, next: (err?: mongoose.CallbackError) => void) {
  if (this.isNew && this.level === 6) {
    console.log("Creating Owner account for AIT...");
  }
  next();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;