import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  people: { type: Number, required: true },
}, { timestamps: true });

BookingSchema.index({ room: 1, start_time: 1, end_time: 1 });

export default mongoose.model('Booking', BookingSchema);