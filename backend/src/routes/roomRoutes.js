import express from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/roomController.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getRooms);
router.post('/', isAdmin, createRoom);
router.put('/:id', isAdmin, updateRoom);
router.delete('/:id', isAdmin, deleteRoom);

export default router;
