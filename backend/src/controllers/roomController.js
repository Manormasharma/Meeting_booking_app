import Room from '../models/Room.js';

const normalizeAmenities = (amenities) => {
  if (amenities === undefined) return undefined;

  const values = Array.isArray(amenities)
    ? amenities
    : String(amenities).split(',');

  return [...new Set(values
    .map((item) => String(item).trim())
    .filter(Boolean))]
    .slice(0, 20);
};

export const getRooms = async (req, res) => {
  try {
    const query = {};
    if (req.query.enabled === 'true') query.enabled = true;
    if (req.query.enabled === 'false') query.enabled = false;

    const rooms = await Room.find(query).sort({ enabled: -1, capacity: 1, name: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { name, capacity, enabled, amenities } = req.body;
    const parsedCapacity = Number(capacity);
    if (!name || !Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      return res.status(400).json({ error: 'Room name and positive integer capacity are required' });
    }

    const room = new Room({
      name: name.trim(),
      capacity: parsedCapacity,
      enabled: enabled ?? true,
      amenities: normalizeAmenities(amenities) || [],
    });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const updates = {};

    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.capacity !== undefined) {
      const parsedCapacity = Number(req.body.capacity);
      if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
        return res.status(400).json({ error: 'Capacity must be a positive integer' });
      }
      updates.capacity = parsedCapacity;
    }
    if (req.body.enabled !== undefined) updates.enabled = Boolean(req.body.enabled);
    if (req.body.amenities !== undefined) updates.amenities = normalizeAmenities(req.body.amenities);

    const room = await Room.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
