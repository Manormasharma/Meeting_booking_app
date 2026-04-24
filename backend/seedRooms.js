// seedRooms.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from './src/models/Room.js';

dotenv.config();

const rooms = [
  { name: 'Conference Room A', capacity: 10, enabled: true },
  { name: 'Conference Room B', capacity: 6, enabled: true },
  { name: 'Board Room', capacity: 20, enabled: true }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await Room.deleteMany({});
    await Room.insertMany(rooms);
    console.log('Rooms seeded!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
