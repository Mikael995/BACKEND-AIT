import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Usually an Admin
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  imageUrl: { type: String },
  category: { type: String, enum: ['Social', 'Professional', 'Cultural'], default: 'Social' }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);