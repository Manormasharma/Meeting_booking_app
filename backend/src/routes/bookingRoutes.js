import express from 'express';
import { getBookings, createBooking } from '../controllers/bookingController.js';
import { isUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBookings);
router.post('/', isUser, createBooking);

export default router;
