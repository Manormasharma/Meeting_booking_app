import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

// Helper: check for booking conflicts
const hasConflict = async (room, start, end) => {
  const conflict = await Booking.findOne({
    room,
    $or: [
      { start_time: { $lt: end }, end_time: { $gt: start } }
    ]
  });
  return !!conflict;
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('room user');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { room, start_time, end_time, people } = req.body;
    const conflict = await hasConflict(room, new Date(start_time), new Date(end_time));
    if (conflict) return res.status(409).json({ error: 'Booking conflict' });
    const booking = new Booking({ ...req.body, user: req.user._id });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};