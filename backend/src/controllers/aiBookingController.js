import { findAvailableRooms, normalizeBookingWindow } from '../services/bookingService.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:6000/api/ai-bookings';

export const parseAndSuggestBooking = async (req, res) => {
  try {
    const { input } = req.body;
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input is required' });
    }

    const aiResponse = await fetch(AI_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        now: new Date().toISOString(),
        timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
      }),
    });

    if (!aiResponse.ok) {
      const body = await aiResponse.json().catch(() => ({}));
      return res.status(502).json({ error: body.error || 'AI service failed' });
    }

    const parsed = await aiResponse.json();
    const people = Number(parsed.people);
    if (!Number.isInteger(people) || people < 1) {
      return res.status(422).json({ error: 'AI response did not include a valid people count', parsed });
    }

    const { start, end } = normalizeBookingWindow(parsed.start_time, parsed.end_time);
    const availableRooms = await findAvailableRooms({ people, start, end });
    const suggestedRoom = availableRooms[0] || null;

    res.json({
      parsed: {
        people,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: Math.round((end - start) / 60000),
      },
      suggested_room: suggestedRoom,
      available_rooms: availableRooms,
      message: suggestedRoom
        ? `Suggested ${suggestedRoom.name}, the smallest available room that fits ${people} people.`
        : 'No enabled room is available for that time and capacity.',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
