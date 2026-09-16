import express from 'express';
import {
  createPrescription,
  getMyPrescriptions,
  getMyCreatedPrescriptions,
  getAllPrescriptions,
  getPatientPrescriptions,
  dispensePrescription,
  cancelPrescription,
} from '../controllers/prescriptionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('doctor', 'admin'), createPrescription);
router.get('/my', authorize('patient'), getMyPrescriptions);
router.get('/my-created', authorize('doctor'), getMyCreatedPrescriptions);
router.get('/', authorize('admin', 'pharmacist'), getAllPrescriptions);
router.get('/patient/:patientId', getPatientPrescriptions);

router.patch('/:id/dispense', authorize('admin', 'pharmacist'), dispensePrescription);
router.patch('/:id/cancel', authorize('doctor', 'admin'), cancelPrescription);

export default router;
