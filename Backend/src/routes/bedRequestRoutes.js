import express from 'express';
import {
  createBedRequest,
  getMyBedRequests,
  getAllBedRequests,
  approveBedRequest,
  rejectBedRequest,
} from '../controllers/bedRequestController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('patient'), createBedRequest);
router.get('/my', authorize('patient'), getMyBedRequests);
router.get('/', authorize('admin'), getAllBedRequests);
router.patch('/:id/approve', authorize('admin'), approveBedRequest);
router.patch('/:id/reject', authorize('admin'), rejectBedRequest);

export default router;
