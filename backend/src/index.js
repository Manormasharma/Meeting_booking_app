import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiBookingRoutes from './routes/aiBookingRoutes.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai-bookings', aiBookingRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => console.error(err));
