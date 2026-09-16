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

// Book appointment (supports both / and /book)
router.post('/', bookAppointment);
router.post('/book', bookAppointment);

// Patient: Get own appointments (supports both /my and /my-appointments)
router.get('/my', getMyAppointments);
router.get('/my-appointments', getMyAppointments);

// Doctor: Get assigned appointments
router.get('/doctor', authorize('doctor'), getDoctorAppointments);

// Nurse: Get assigned appointments
router.get('/nurse', authorize('nurse'), getNurseAppointments);

// Admin & Receptionist: Get all appointments
router.get('/', authorize('admin', 'receptionist'), getAllAppointments);

// Update status
router.patch('/:id/status', updateAppointmentStatus);

// Cancel (alias for status update to Cancelled)
router.patch('/:id/cancel', (req, res, next) => {
  req.body.status = 'Cancelled';
  return updateAppointmentStatus(req, res, next);
});

// Reschedule
router.patch('/:id/reschedule', rescheduleAppointment);

export default router;
