import express from 'express';
import auth from '../middleware/auth';
import Event from '../models/Event'; // Make sure you created the Model we discussed

const router = express.Router();

// Get all events for the dashboard
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

export default router;