import express from 'express';
import {
  createDoctor,
  createNurse,
  getDoctors,
  getNurses,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All user routes require valid JWT authentication
router.use(authenticate);

// Admin-Only Practitioner Creation Endpoints
router.post('/doctors', authorize('admin'), createDoctor);
router.post('/nurses', authorize('admin'), createNurse);

// Practitioner Directory Endpoints
router.get('/doctors', getDoctors);
router.get('/nurses', getNurses);

export default router;
