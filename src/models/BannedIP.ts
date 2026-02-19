import mongoose, { Schema, Document } from 'mongoose';

export interface IBannedIP extends Document {
  ip: string;
  reason: string;
  adminId: mongoose.Types.ObjectId;
}

const BannedIPSchema = new Schema({
  ip: { type: String, required: true, unique: true },
  reason: { type: String, default: "Violation of community guidelines" },
  adminId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<IBannedIP>('BannedIP', BannedIPSchema);