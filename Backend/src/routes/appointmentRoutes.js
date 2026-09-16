import express from 'express';
import {
  getProviders,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getNurseAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All appointment routes require authentication
router.use(authenticate);

// Get available providers
router.get('/providers', getProviders);

// Book appointment
router.post('/', bookAppointment);

// Patient: Get own appointments
router.get('/my', getMyAppointments);

// Doctor: Get assigned appointments
router.get('/doctor', authorize('doctor'), getDoctorAppointments);

// Nurse: Get assigned appointments
router.get('/nurse', authorize('nurse'), getNurseAppointments);

// Admin & Receptionist: Get all appointments
router.get('/', authorize('admin', 'receptionist'), getAllAppointments);

// Update status / cancel
router.patch('/:id/status', updateAppointmentStatus);

// Reschedule
router.patch('/:id/reschedule', rescheduleAppointment);

export default router;
