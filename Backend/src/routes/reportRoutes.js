import express from 'express';
import {
  getOverviewReport,
  getPatientsReport,
  getAppointmentsReport,
  getRoomsReport,
  getPharmacyReport,
  getBloodBankReport,
  getVisitorsReport,
  getBillingReport,
  getDietPlansReport
} from '../controllers/reportController.js';
import authenticate from '../middleware/authMiddleware.js';
import authorize from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// 1. Overview / Summary Report (Admin, Doctor, Nurse, Receptionist)
router.get('/overview', authorize('admin', 'doctor', 'nurse', 'receptionist'), getOverviewReport);
router.get('/summary', authorize('admin', 'doctor', 'nurse', 'receptionist'), getOverviewReport);

// 2. Patient Demographics & Bed Status (Admin, Doctor, Nurse, Receptionist)
router.get('/patients', authorize('admin', 'doctor', 'nurse', 'receptionist'), getPatientsReport);

// 3. Appointment Analytics (Admin, Doctor, Nurse, Receptionist)
router.get('/appointments', authorize('admin', 'doctor', 'nurse', 'receptionist'), getAppointmentsReport);

// 4. Rooms & Bed Occupancy (Admin, Doctor, Nurse, Receptionist)
router.get('/rooms', authorize('admin', 'doctor', 'nurse', 'receptionist'), getRoomsReport);
router.get('/bed-occupancy', authorize('admin', 'doctor', 'nurse', 'receptionist'), getRoomsReport);

// 5. Pharmacy Inventory & Prescriptions (Admin, Doctor, Nurse, Pharmacist)
router.get('/pharmacy', authorize('admin', 'doctor', 'nurse', 'pharmacist'), getPharmacyReport);
router.get('/pharmacy-inventory', authorize('admin', 'doctor', 'nurse', 'pharmacist'), getPharmacyReport);

// 6. Blood Bank Stock & Requests (Admin, Doctor, Nurse, Receptionist)
router.get('/blood-bank', authorize('admin', 'doctor', 'nurse', 'receptionist'), getBloodBankReport);

// 7. Visitor Logs & Status (Admin, Receptionist)
router.get('/visitors', authorize('admin', 'receptionist'), getVisitorsReport);

// 8. Billing & Collections (Admin, Receptionist)
router.get('/billing', authorize('admin', 'receptionist'), getBillingReport);
router.get('/financial', authorize('admin', 'receptionist'), getBillingReport);

// 9. Diet Plans Analytics (Admin, Doctor, Nurse)
router.get('/diet-plans', authorize('admin', 'doctor', 'nurse'), getDietPlansReport);
router.get('/diet-compliance', authorize('admin', 'doctor', 'nurse'), getDietPlansReport);

export default router;
