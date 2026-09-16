import express from 'express';
import { allocateBed, releaseBed } from '../controllers/bedController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/allocate', authorize('admin'), allocateBed);
router.patch('/:id/release', authorize('admin'), releaseBed);

export default router;
