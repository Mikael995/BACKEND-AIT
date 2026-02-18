import { Response } from 'express';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/auth';
import { v2 as cloudinary } from 'cloudinary';

/**
 * 1. Create an Event (Requires Level 2+)
 */
export const createEvent = async (req: any, res: Response) => {
  try {
    const { title, description, date, location, category } = req.body;
    let imageUrl = "";

    // Handle Image Upload if a file exists
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'ait_events',
        transformation: [{ width: 1000, height: 600, crop: 'fill' }]
      });
      imageUrl = result.secure_url;
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category,
      eventImage: imageUrl, // Added image field
      organizer: req.user?.id,
      attendees: [req.user?.id]
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
};

/**
 * 2. Search Events 
 */
export const searchEvents = async (req: any, res: Response) => {
  const query = req.query.query as string;
  if (!query) return res.status(200).json([]);

  try {
    const events = await Event.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    }).sort({ date: 1 }).populate('organizer', 'firstName lastName profileImage');

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Event search failed" });
  }
};

/**
 * 3. RSVP to Event
 */
export const rsvpToEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { attendees: req.user?.id } },
      { new: true }
    );
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "RSVP failed" });
  }
};