import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getProfile,
  updateProfile,
  updateProfilePicture,
} from '../controllers/profileController.js';

const router = express.Router();

// All profile routes are protected by JWT authentication
router.use(authenticate);

router.route('/me')
  .get(getProfile)
  .put(updateProfile);

router.put('/me/picture', updateProfilePicture);

export default router;
