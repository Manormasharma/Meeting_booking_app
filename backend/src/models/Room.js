import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Room', RoomSchema);