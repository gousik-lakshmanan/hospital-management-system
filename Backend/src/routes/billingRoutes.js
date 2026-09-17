import express from 'express';
import {
  getBills,
  getMyBills,
  getBillingSummary,
  getBillById,
  getBillsByPatientId,
  createBill,
  recordPayment,
  cancelBill
} from '../controllers/billingController.js';
import authenticate from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Special specific routes before :id
router.get('/summary', authorize('admin', 'receptionist'), getBillingSummary);
router.get('/my', authorize('patient'), getMyBills);
router.get('/patient/:patientId', authorize('admin', 'doctor', 'nurse', 'receptionist', 'patient'), getBillsByPatientId);

// Generic collection & single invoice routes
router.get('/', authorize('admin', 'doctor', 'nurse', 'receptionist', 'patient'), getBills);
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'receptionist', 'patient'), getBillById);

// Create invoice & record payment
router.post('/', authorize('admin', 'receptionist'), createBill);
router.patch('/:id/payment', authorize('admin', 'receptionist'), recordPayment);
router.patch('/:id/cancel', authorize('admin'), cancelBill);

export default router;
