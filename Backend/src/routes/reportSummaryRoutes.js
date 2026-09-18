import express from 'express';
import { generateReportSummary, getMyReportSummaries } from '../controllers/reportSummaryController.js';
import authenticate from '../middleware/authMiddleware.js';
import { uploadReportFile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All report routes require authentication
router.use(authenticate);

// POST /api/report-summaries  (multipart/form-data with a single 'report' file)
router.post('/', uploadReportFile, generateReportSummary);

// GET /api/report-summaries/me
router.get('/me', getMyReportSummaries);

export default router;