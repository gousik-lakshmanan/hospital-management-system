import express from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deactivateMedicine,
  adjustStock,
} from '../controllers/pharmacyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/medicines', getMedicines);
router.get('/medicines/:id', getMedicineById);

router.post('/medicines', authorize('admin', 'pharmacist'), createMedicine);
router.put('/medicines/:id', authorize('admin', 'pharmacist'), updateMedicine);
router.patch('/medicines/:id/deactivate', authorize('admin', 'pharmacist'), deactivateMedicine);
router.patch('/medicines/:id/stock', authorize('admin', 'pharmacist'), adjustStock);

export default router;
