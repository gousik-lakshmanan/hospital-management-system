import express from 'express';
import {
  createBloodRequest,
  getMyBloodRequests,
  getAllBloodRequests,
  getBloodRequestById,
  approveBloodRequest,
  negotiateBloodRequest,
  rejectBloodRequest,
} from '../controllers/bloodRequestController.js';
import authenticate from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// 1. Create Blood Request (Doctor, Nurse, Receptionist, Patient)
router.post('/', authorize('doctor', 'nurse', 'receptionist', 'patient'), createBloodRequest);

// 2. View My Requests (Owner-scoped)
router.get('/my', getMyBloodRequests);

// 3. Admin View All Requests
router.get('/', authorize('admin'), getAllBloodRequests);

// 4. View Specific Request (Owner or Admin)
router.get('/:id', getBloodRequestById);

// 5. Admin Approve / Negotiate / Reject (Strictly Admin only)
router.patch('/:id/approve', authorize('admin'), approveBloodRequest);
router.patch('/:id/negotiate', authorize('admin'), negotiateBloodRequest);
router.patch('/:id/reject', authorize('admin'), rejectBloodRequest);

export default router;
