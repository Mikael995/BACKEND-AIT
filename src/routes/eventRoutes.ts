import express from 'express';
import auth from '../middleware/auth';
import { checkLevel } from '../middleware/checkLevel';
import { 
  createEvent, 
  searchEvents, 
  rsvpToEvent 
} from '../controllers/eventController';
import multer from 'multer';
import path from 'path'; // Now we will use this!

const router = express.Router();

// 1. IMPROVED STORAGE ENGINE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Use 'path' to keep the original file extension (e.g., .jpg, .png)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * Routes
 */

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    // Using a dynamic import or assuming Event is imported at the top
    const Event = (await import('../models/Event')).default;
    const events = await Event.find()
      .populate('organizer', 'firstName lastName profileImage')
      .sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

router.get('/search', auth, searchEvents);

// Create event with Image (Level 2+)
router.post(
  '/', 
  auth, 
  checkLevel(2), 
  upload.single('image'), 
  createEvent
);

router.post('/:id/rsvp', auth, rsvpToEvent);

export default router;