import express from 'express';
import { parseAndSuggestBooking } from '../controllers/aiBookingController.js';
import { isUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/', isUser, parseAndSuggestBooking);

export default router;
