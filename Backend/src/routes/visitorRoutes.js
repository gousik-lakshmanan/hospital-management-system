import express from 'express';
import {
  getVisitors,
  getVisitorById,
  getVisitorsByPatientId,
  createVisitor,
  checkInVisitor,
  checkOutVisitor,
  cancelVisitor,
  updateVisitor
} from '../controllers/visitorController.js';
import authenticate from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// View passes (admin, doctor, nurse, receptionist, patient)
router.get('/', authorize('admin', 'doctor', 'nurse', 'receptionist', 'patient'), getVisitors);
router.get('/patient/:patientId', authorize('admin', 'doctor', 'nurse', 'receptionist', 'patient'), getVisitorsByPatientId);
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'receptionist', 'patient'), getVisitorById);

// Manage passes (admin, receptionist only)
router.post('/', authorize('admin', 'receptionist'), createVisitor);
router.patch('/:id/check-in', authorize('admin', 'receptionist'), checkInVisitor);
router.post('/:id/check-in', authorize('admin', 'receptionist'), checkInVisitor);
router.patch('/:id/check-out', authorize('admin', 'receptionist'), checkOutVisitor);
router.post('/:id/check-out', authorize('admin', 'receptionist'), checkOutVisitor);
router.patch('/:id/cancel', authorize('admin', 'receptionist'), cancelVisitor);
router.post('/:id/cancel', authorize('admin', 'receptionist'), cancelVisitor);
router.patch('/:id', authorize('admin', 'receptionist'), updateVisitor);

export default router;
