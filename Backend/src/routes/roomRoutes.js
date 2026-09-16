import express from 'express';
import { getRooms, getRoomBeds, getAvailableBeds } from '../controllers/roomController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getRooms);
router.get('/:roomId/beds', getRoomBeds);
router.get('/:roomId/beds/available', getAvailableBeds);

export default router;
