import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  adminTest,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);

// RBAC demonstration / test endpoint
router.get('/admin-test', authenticate, authorize('admin'), adminTest);

export default router;
