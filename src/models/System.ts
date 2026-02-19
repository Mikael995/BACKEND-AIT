import mongoose, { Schema, Document } from 'mongoose';

export interface ISystem extends Document {
  maintenance: boolean;
  lastUpdatedBy: mongoose.Types.ObjectId;
}

const SystemSchema: Schema = new Schema({
  maintenance: { type: Boolean, default: false },
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<ISystem>('System', SystemSchema);