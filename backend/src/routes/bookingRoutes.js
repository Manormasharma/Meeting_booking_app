import express from 'express';
import {
  cancelBooking,
  checkBookingAvailability,
  createBooking,
  getAvailability,
  getBookings,
  quickBook,
  releaseBooking,
} from '../controllers/bookingController.js';
import { isUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', isUser, getBookings);
router.get('/availability', getAvailability);
router.get('/check-availability', checkBookingAvailability);
router.post('/', isUser, createBooking);
router.post('/quick', isUser, quickBook);
router.patch('/:id/cancel', isUser, cancelBooking);
router.patch('/:id/release', isUser, releaseBooking);

export default router;
