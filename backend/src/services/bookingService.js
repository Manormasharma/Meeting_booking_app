import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

const roomLocks = new Map();

export const normalizeBookingWindow = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Start time and end time must be valid dates');
  }

  if (start >= end) {
    throw new Error('End time must be after start time');
  }

  return { start, end };
};

export const findBookingConflict = (roomId, start, end) => {
  return Booking.findOne({
    room_id: roomId,
    status: 'active',
    start_time: { $lt: end },
    end_time: { $gt: start },
  });
};

export const findAvailableRooms = async ({ people, start, end }) => {
  const conflictingRoomIds = await Booking.distinct('room_id', {
    status: 'active',
    start_time: { $lt: end },
    end_time: { $gt: start },
  });

  const rooms = await Room.find({
    enabled: true,
    capacity: { $gte: people },
    _id: { $nin: conflictingRoomIds },
  }).sort({ capacity: 1, name: 1 });

  return rooms;
};

export const getRoomAvailability = async ({ from = new Date(), to } = {}) => {
  const start = new Date(from);
  const end = to ? new Date(to) : new Date(start.getTime() + 60 * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new Error('Availability window is invalid');
  }

  const [rooms, bookings] = await Promise.all([
    Room.find().sort({ enabled: -1, capacity: 1, name: 1 }),
    Booking.find({
      status: 'active',
      start_time: { $lt: end },
      end_time: { $gt: start },
    })
      .populate('room_id', 'name capacity enabled')
      .populate('user', 'username role')
      .sort({ start_time: 1 }),
  ]);

  return rooms.map((room) => {
    const currentBooking = bookings.find(
      (booking) => booking.room_id?._id?.toString() === room._id.toString()
    );

    return {
      room,
      available: room.enabled && !currentBooking,
      current_booking: currentBooking || null,
    };
  });
};

export const validateBookingInput = async ({ room, start_time, end_time, people }) => {
  if (!room) throw new Error('Room is required');
  const attendeeCount = Number(people);

  if (!Number.isInteger(attendeeCount) || attendeeCount < 1) {
    throw new Error('People must be a positive integer');
  }

  const { start, end } = normalizeBookingWindow(start_time, end_time);
  const selectedRoom = await Room.findById(room);

  if (!selectedRoom) throw new Error('Room not found');
  if (!selectedRoom.enabled) throw new Error('Room is disabled');
  if (selectedRoom.capacity < attendeeCount) {
    throw new Error('Room capacity is too small for this booking');
  }

  return { room: selectedRoom, start, end, people: attendeeCount };
};

export const withRoomLock = async (roomId, work) => {
  const key = roomId.toString();
  const previous = roomLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);

  roomLocks.set(key, chained);

  try {
    await previous;
    return await work();
  } finally {
    release();
    if (roomLocks.get(key) === chained) {
      roomLocks.delete(key);
    }
  }
};


// ADD BELOW YOUR EXISTING CODE (do not remove anything above)

////////////////////////////////////////////////////////////////////////////////
// 🔒 Check availability using existing conflict logic
////////////////////////////////////////////////////////////////////////////////
export const isRoomAvailable = async ({ roomId, start, end }) => {
  const conflict = await findBookingConflict(roomId, start, end);
  return !conflict;
};

////////////////////////////////////////////////////////////////////////////////
// ✅ Create booking (with lock + validation + conflict safety)
////////////////////////////////////////////////////////////////////////////////
export const createBooking = async ({
  roomId,
  start,
  end,
  people,
  userId,
}) => {
  return withRoomLock(roomId, async () => {
    // 🔍 Double-check conflict inside lock (critical)
    const conflict = await findBookingConflict(roomId, start, end);

    if (conflict) {
      throw new Error('ROOM_ALREADY_BOOKED');
    }

    const booking = await Booking.create({
      room_id: roomId,
      user: userId,
      start_time: start,
      end_time: end,
      people,
      status: 'active',
    });

    return booking;
  });
};

////////////////////////////////////////////////////////////////////////////////
// 🔁 Try booking with fallback (agent behavior)
////////////////////////////////////////////////////////////////////////////////
export const tryBookingWithFallback = async ({
  rooms,
  start,
  end,
  people,
  userId,
}) => {
  // 1️⃣ Try each room at original time
  for (const room of rooms) {
    try {
      const booking = await createBooking({
        roomId: room._id,
        start,
        end,
        people,
        userId,
      });

      return { booking, room };
    } catch (err) {
      if (err.message !== 'ROOM_ALREADY_BOOKED') throw err;
    }
  }

  // 2️⃣ Shift time (+30 mins)
  const shiftedStart = new Date(start.getTime() + 30 * 60000);
  const shiftedEnd = new Date(end.getTime() + 30 * 60000);

  for (const room of rooms) {
    try {
      const booking = await createBooking({
        roomId: room._id,
        start: shiftedStart,
        end: shiftedEnd,
        people,
        userId,
      });

      return {
        booking,
        room,
        shifted: true,
        shiftedStart,
        shiftedEnd,
      };
    } catch (err) {
      if (err.message !== 'ROOM_ALREADY_BOOKED') throw err;
    }
  }

  // 3️⃣ No success
  return null;
};
