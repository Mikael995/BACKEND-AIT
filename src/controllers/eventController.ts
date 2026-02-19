// src/controllers/eventController.ts

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
    let uploadedImageUrl = "";

    // Handle Image Upload if a file exists
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'ait_events',
        transformation: [{ width: 1000, height: 600, crop: 'fill' }]
      });
      uploadedImageUrl = result.secure_url;
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category,
      eventImage: uploadedImageUrl, // This now matches the Model exactly
      organizer: req.user?.id,
      attendees: [req.user?.id]
    });

    const savedEvent = await newEvent.save();
    
    // Populate organizer info before sending to frontend
    const populatedEvent = await Event.findById(savedEvent._id).populate(
      'organizer', 
      'firstName lastName profileImage'
    );

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
};

/**
 * 2. Search / Get All Events 
 */
export const searchEvents = async (req: any, res: Response) => {
  const query = req.query.query as string;

  try {
    let filter = {};
    if (query) {
      filter = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      };
    }

    const events = await Event.find(filter)
      .sort({ date: 1 })
      .populate('organizer', 'firstName lastName profileImage')
      .populate('attendees', 'profileImage'); // Added for attendee avatars

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Event retrieval failed" });
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
    ).populate('attendees', 'profileImage');
    
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "RSVP failed" });
  }
};

/**
 * 4. Delete an Event (Only Organizer)
 */
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the user is the organizer
    if (event.organizer.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete event" });
  }
};