import express from 'express';
import { generateReportSummary, getMyReportSummaries } from '../controllers/reportSummaryController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

// All report routes require authentication
router.use(authenticate);

// POST /api/report-summaries
router.post('/', generateReportSummary);

// GET /api/report-summaries/me
router.get('/me', getMyReportSummaries);

export default router;
