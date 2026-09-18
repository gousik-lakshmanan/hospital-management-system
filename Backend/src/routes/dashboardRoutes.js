import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Universal role-resolved dashboard
router.get('/', getDashboard);

export default router;
