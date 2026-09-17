import express from 'express';
import {
  getBloodStock,
  getBloodStockByGroup,
  updateBloodStock,
  getDonors,
  registerDonor,
  updateDonor,
} from '../controllers/bloodBankController.js';
import authenticate from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// 1. Stock Endpoints
// View stock: admin, doctor, nurse, receptionist, pharmacist, patient
router.get('/stock', getBloodStock);
router.get('/stock/:bloodGroup', getBloodStockByGroup);

// Admin stock adjustment
router.patch('/stock/:bloodGroup', authorize('admin'), updateBloodStock);
router.post('/stock', authorize('admin'), (req, res) => {
  req.params.bloodGroup = req.body.bloodGroup || req.body.group;
  return updateBloodStock(req, res);
});

// 2. Donor Endpoints
// View donors: admin, doctor, nurse, receptionist (Patient blocked with HTTP 403)
router.get('/donors', authorize('admin', 'doctor', 'nurse', 'receptionist'), getDonors);

// Register & Update donor: admin only
router.post('/donors', authorize('admin'), registerDonor);
router.patch('/donors/:id', authorize('admin'), updateDonor);

export default router;
