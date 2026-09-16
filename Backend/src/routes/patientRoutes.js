import express from 'express';
import {
  getMyPatientProfile,
  getPatients,
  getPatientById,
  updatePatientVitals,
  createPatient,
} from '../controllers/patientController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current logged-in patient's own profile and vitals
router.get('/me', getMyPatientProfile);

// Get all hospital patients (Admin, Doctor, Nurse, Receptionist)
router.get('/', authorize('admin', 'doctor', 'nurse', 'receptionist'), getPatients);

// Register a clinical patient file (Admin, Receptionist)
router.post('/', authorize('admin', 'receptionist'), createPatient);

// Get specific patient by ID (Admin, Doctor, Nurse, Receptionist, or Patient self-view)
router.get('/:id', getPatientById);

// STRICT MANDATORY RULE: ONLY NURSES can record/update vitals
router.put('/:id/vitals', authorize('nurse'), updatePatientVitals);

export default router;
