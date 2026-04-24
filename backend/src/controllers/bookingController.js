import Booking from '../models/Booking.js';
import {
  findBookingConflict,
  findAvailableRooms,
  getRoomAvailability,
  normalizeBookingWindow,
  validateBookingInput,
  withRoomLock,
} from '../services/bookingService.js';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEventEnd,
} from '../services/googleCalendarService.js';

const populateBooking = (booking) => booking.populate([
  { path: 'room_id', select: 'name capacity enabled' },
  { path: 'user', select: 'username role' },
]);

const syncCreatedBookingToCalendar = async (booking) => {
  try {
    const calendarEvent = await createCalendarEvent(booking);
    if (!calendarEvent) return;

    booking.google_calendar_event_id = calendarEvent.eventId;
    booking.google_calendar_html_link = calendarEvent.htmlLink;
    await booking.save();
  } catch (err) {
    console.warn(`Google Calendar create failed for booking ${booking._id}: ${err.message}`);
  }
};

const syncCancelledBookingToCalendar = async (booking) => {
  try {
    await deleteCalendarEvent(booking);
  } catch (err) {
    console.warn(`Google Calendar delete failed for booking ${booking._id}: ${err.message}`);
  }
};

const syncReleasedBookingToCalendar = async (booking) => {
  try {
    await updateCalendarEventEnd(booking);
  } catch (err) {
    console.warn(`Google Calendar update failed for booking ${booking._id}: ${err.message}`);
  }
};

export const getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.room) filter.room_id = req.query.room;
    if (req.query.from || req.query.to) {
      filter.start_time = {};
      if (req.query.from) filter.start_time.$gte = new Date(req.query.from);
      if (req.query.to) filter.start_time.$lte = new Date(req.query.to);
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.mine === 'true') filter.user = req.user?._id;

    const bookings = await Booking.find(filter)
      .populate('room_id', 'name capacity enabled')
      .populate('user', 'username role')
      .sort({ start_time: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const availability = await getRoomAvailability({
      from: req.query.from || new Date(),
      to: req.query.to,
    });

    res.json(availability);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getPublicSchedule = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date();
    const to = req.query.to
      ? new Date(req.query.to)
      : new Date(from.getTime() + 24 * 60 * 60 * 1000);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      return res.status(400).json({ error: 'Schedule window is invalid' });
    }

    const bookings = await Booking.find({
      status: 'active',
      start_time: { $lt: to },
      end_time: { $gt: from },
    })
      .populate('room_id', 'name capacity enabled')
      .populate('user', 'username role')
      .sort({ start_time: 1 });

    res.json(bookings.map((booking) => ({
      _id: booking._id,
      room: booking.room_id,
      booked_by: booking.user?.username || 'Unknown',
      start_time: booking.start_time,
      end_time: booking.end_time,
      duration_minutes: Math.round((booking.end_time - booking.start_time) / 60000),
      people: booking.people,
      status: booking.status,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { room, start_time, end_time, people } = req.body;
    const validated = await validateBookingInput({ room, start_time, end_time, people });

    const booking = await withRoomLock(validated.room._id, async () => {
      const conflict = await findBookingConflict(validated.room._id, validated.start, validated.end);
      if (conflict) {
        const error = new Error('Booking conflict');
        error.statusCode = 409;
        throw error;
      }

      return Booking.create({
        room_id: validated.room._id,
        user: req.user._id,
        start_time: validated.start,
        end_time: validated.end,
        people: validated.people,
      });
    });

    const populated = await populateBooking(booking);
    await syncCreatedBookingToCalendar(populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
};

export const quickBook = async (req, res) => {
  try {
    const people = Number(req.body.people || 1);
    const durationMinutes = Number(req.body.duration_minutes || 30);

    if (!Number.isInteger(people) || people < 1) {
      return res.status(400).json({ error: 'People must be a positive integer' });
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 480) {
      return res.status(400).json({ error: 'Duration must be between 15 and 480 minutes' });
    }

    const start = new Date();
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const rooms = await findAvailableRooms({ people, start, end });
    const selectedRoom = rooms[0];

    if (!selectedRoom) {
      return res.status(409).json({ error: 'No room is currently available for quick booking' });
    }

    const booking = await withRoomLock(selectedRoom._id, async () => {
      const conflict = await findBookingConflict(selectedRoom._id, start, end);
      if (conflict) {
        const error = new Error('Booking conflict');
        error.statusCode = 409;
        throw error;
      }

      return Booking.create({
        room_id: selectedRoom._id,
        user: req.user._id,
        start_time: start,
        end_time: end,
        people,
      });
    });

    const populated = await populateBooking(booking);
    await syncCreatedBookingToCalendar(populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (booking.status !== 'active') {
      return res.status(400).json({ error: `Booking is already ${booking.status}` });
    }

    booking.status = 'cancelled';
    booking.cancelled_at = new Date();
    await booking.save();
    await syncCancelledBookingToCalendar(booking);

    const populated = await populateBooking(booking);
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const releaseBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (booking.status !== 'active') {
      return res.status(400).json({ error: `Booking is already ${booking.status}` });
    }

    const now = new Date();
    if (now < booking.start_time || now >= booking.end_time) {
      return res.status(400).json({ error: 'Only an in-progress booking can be released early' });
    }

    booking.status = 'released';
    booking.released_at = now;
    booking.end_time = now;
    await booking.save();
    await syncReleasedBookingToCalendar(booking);

    const populated = await populateBooking(booking);
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const checkBookingAvailability = async (req, res) => {
  try {
    const people = Number(req.query.people || 1);
    if (!Number.isInteger(people) || people < 1) {
      return res.status(400).json({ error: 'People must be a positive integer' });
    }

    const { start, end } = normalizeBookingWindow(req.query.start_time, req.query.end_time);
    const rooms = await findAvailableRooms({ people, start, end });

    res.json({ available_rooms: rooms, suggested_room: rooms[0] || null });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
