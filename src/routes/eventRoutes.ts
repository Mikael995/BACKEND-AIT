// src/routes/eventRoutes.ts
import express from 'express';
import auth from '../middleware/auth';
import { checkLevel } from '../middleware/checkLevel';
import Event from '../models/Event';
import { 
  createEvent, 
  searchEvents, 
  rsvpToEvent,
  deleteEvent 
} from '../controllers/eventController';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all events - Populated correctly for the owner check
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'firstName lastName profileImage')
      .populate('attendees', 'profileImage')
      .sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

router.get('/search', auth, searchEvents);

router.post('/', auth, checkLevel(2), upload.single('image'), createEvent);
router.post('/:id/rsvp', auth, rsvpToEvent);
router.delete('/:id', auth, deleteEvent);

export default router;