import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  people: { type: Number, required: true },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'released'],
    default: 'active',
    index: true,
  },
  cancelled_at: { type: Date },
  released_at: { type: Date },
  google_calendar_event_id: { type: String },
  google_calendar_html_link: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

BookingSchema.virtual('room').get(function getRoom() {
  return this.room_id;
});

BookingSchema.index({ room_id: 1, start_time: 1, end_time: 1 });

export default mongoose.model('Booking', BookingSchema);
