import axios from 'axios';
import {
  findAvailableRooms,
  normalizeBookingWindow,
  tryBookingWithFallback,
} from '../services/bookingService.js';

const AI_SERVICE_URL = 'http://ai-service:6000/api/ai-bookings';

export const parseAndSuggestBooking = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input is required' });
    }

    // 🔹 Step 1: AI parsing
    const aiResponse = await axios.post(AI_SERVICE_URL, {
      input,
      now: new Date().toISOString(),
      timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
    });

    const parsed = aiResponse.data;

    const people = Number(parsed.people);
    if (!Number.isInteger(people) || people < 1) {
      return res.status(422).json({ error: 'Invalid people count', parsed });
    }

    // 🔹 Step 2: Normalize time
    const { start, end } = normalizeBookingWindow(
      parsed.start_time,
      parsed.end_time
    );

    // 🔹 Step 3: Find rooms
    const availableRooms = await findAvailableRooms({ people, start, end });

    if (!availableRooms.length) {
      return res.json({
        success: false,
        action: "FAILED",
        message: "❌ No rooms available for that time",
      });
    }

    // 🔥 Step 4: TRY BOOKING (THIS WAS MISSING)
    const result = await tryBookingWithFallback({
      rooms: availableRooms,
      start,
      end,
      people,
      userId: req.user?._id,
    });

    // ❌ Nothing worked
    if (!result) {
      return res.json({
        success: false,
        action: "FAILED",
        message: "❌ No rooms available even after retry",
      });
    }

    // ✅ SUCCESS
    return res.json({
      success: true,
      action: "BOOKED",
      booking: result.booking,
      room: result.room,
      parsed: {
        people,
        start_time: (result.shiftedStart || start).toISOString(),
        end_time: (result.shiftedEnd || end).toISOString(),
      },
      message: result.shifted
        ? `⚠️ Original slot unavailable. Booked ${result.room.name} at adjusted time.`
        : `${result.room.name} room booked successfully`,
    });

  } catch (err) {
    console.error("❌ AI BOOKING ERROR:", err.message);

    return res.status(500).json({
      error: err.message,
    });
  }
};