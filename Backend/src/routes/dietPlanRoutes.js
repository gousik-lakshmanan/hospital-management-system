import express from 'express';
import {
  createDietPlan,
  getMyDietPlans,
  getMyTodayTarget,
  getDietPlans,
  assignDietPlan
} from '../controllers/dietPlanController.js';
import authenticate from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Patient & User personal routes
router.get('/me', authorize('patient', 'doctor', 'nurse', 'admin', 'receptionist'), getMyDietPlans);
router.get('/me/today', authorize('patient', 'doctor', 'nurse', 'admin', 'receptionist'), getMyTodayTarget);

// Generate diet plan (Patient or Clinician)
router.post('/', authorize('patient', 'doctor', 'nurse', 'admin'), createDietPlan);

// Clinical directory & direct assignment (Doctors, Nurses, Admins)
router.get('/', authorize('doctor', 'nurse', 'admin'), getDietPlans);
router.post('/assign', authorize('doctor', 'nurse', 'admin'), assignDietPlan);

export default router;
