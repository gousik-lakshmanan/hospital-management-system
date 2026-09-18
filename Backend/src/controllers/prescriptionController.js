import mongoose from 'mongoose';
import Prescription from '../models/Prescription.js';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { createNotification, notifyRoles } from '../services/notificationService.js';

// POST /api/prescriptions - Doctor/Admin creates a new prescription (Status: Pending, No stock deducted)
export const createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, diagnosis, instructions } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one medicine must be prescribed',
      });
    }

    // 1. Resolve patient User document
    let patientUser = await User.findById(patientId);
    if (!patientUser) {
      const patientDoc = await Patient.findById(patientId);
      if (patientDoc && patientDoc.userId) {
        patientUser = await User.findById(patientDoc.userId);
      }
    }

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const patientName = `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim() || 'Patient';
    const patientEmail = patientUser.email || '';

    // 2. Validate each medicine and build authoritative snapshot list
    const validatedMedicines = [];
    for (const item of medicines) {
      if (!item.medicineId) {
        return res.status(400).json({
          success: false,
          message: 'Medicine ID is required for each prescribed item',
        });
      }

      const qty = parseInt(item.quantity) || 1;
      if (qty < 1) {
        return res.status(400).json({
          success: false,
          message: 'Prescribed quantity must be at least 1',
        });
      }

      const medDoc = await Medicine.findById(item.medicineId);
      if (!medDoc) {
        return res.status(404).json({
          success: false,
          message: `Medicine not found for ID: ${item.medicineId}`,
        });
      }

      if (!medDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: `Medicine '${medDoc.name}' is currently inactive and cannot be prescribed`,
        });
      }

      validatedMedicines.push({
        medicineId: medDoc._id,
        medicineName: medDoc.name,
        dosage: item.dosage ? item.dosage.trim() : '1-0-1',
        frequency: item.frequency ? item.frequency.trim() : 'Twice daily',
        duration: item.duration ? item.duration.trim() : '5 days',
        quantity: qty,
        instructions: item.instructions ? item.instructions.trim() : '',
      });
    }

    const prescribedByName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Doctor';

    // 3. Save new Prescription (Status remains 'Pending', ZERO stock deducted)
    const newPrescription = new Prescription({
      patientId: patientUser._id,
      patientName,
      patientEmail,
      prescribedBy: req.user._id,
      prescribedByName,
      medicines: validatedMedicines,
      diagnosis: diagnosis ? diagnosis.trim() : '',
      instructions: instructions ? instructions.trim() : '',
      status: 'Pending',
    });

    await newPrescription.save();

    // 4. Backward compatibility sync to Patient record if present
    try {
      const patientDoc = await Patient.findOne({ userId: patientUser._id });
      if (patientDoc) {
        for (const item of validatedMedicines) {
          patientDoc.prescriptions.push({
            medicine: item.medicineName,
            dosage: item.dosage,
            duration: item.duration,
            pharmacistGiven: false,
          });
        }
        if (diagnosis && !patientDoc.medicalHistory.includes(diagnosis.trim())) {
          patientDoc.medicalHistory.push(diagnosis.trim());
        }
        await patientDoc.save();
      }
    } catch (syncErr) {
      console.error('Non-critical sync error to Patient document:', syncErr.message);
    }

    // Non-blocking notification hooks
    createNotification({
      recipient: patientUser._id,
      title: 'New Prescription Issued',
      message: `Dr. ${prescribedByName} issued a new prescription for you (${validatedMedicines.length} medicine(s)).`,
      type: 'prescription',
      priority: 'normal',
      link: '/patient/prescriptions',
      metadata: { prescriptionId: newPrescription._id },
      dedupeKey: `rx-create-${newPrescription._id}`
    });
    notifyRoles(['pharmacist', 'admin'], {
      title: 'New Prescription Pending',
      message: `New prescription issued for patient ${patientName} (${validatedMedicines.length} item(s)).`,
      type: 'prescription',
      priority: 'normal',
      link: '/pharmacist/prescriptions',
      metadata: { prescriptionId: newPrescription._id },
      dedupeKey: `rx-create-staff-${newPrescription._id}`
    });

    return res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: newPrescription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message,
    });
  }
};

// GET /api/prescriptions/my - Patient retrieves own prescriptions
export const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your prescriptions',
      error: error.message,
    });
  }
};

// GET /api/prescriptions/my-created - Doctor retrieves prescriptions they created
export const getMyCreatedPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ prescribedBy: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor prescriptions',
      error: error.message,
    });
  }
};

// GET /api/prescriptions - Admin & Pharmacist view all prescriptions
export const getAllPrescriptions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message,
    });
  }
};

// GET /api/prescriptions/patient/:patientId - View specific patient prescriptions
export const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    // If requester is a patient, enforce self-isolation
    if (req.user.role === 'patient') {
      const isMatch = req.user._id.toString() === patientId || req.user.profileId === patientId;
      if (!isMatch) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own prescriptions.',
        });
      }
    }

    // Resolve patient userId
    let targetUserId = patientId;
    const patientDoc = await Patient.findById(patientId);
    if (patientDoc && patientDoc.userId) {
      targetUserId = patientDoc.userId;
    }

    const prescriptions = await Prescription.find({ patientId: targetUserId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient prescriptions',
      error: error.message,
    });
  }
};

// PATCH /api/prescriptions/:id/dispense - Admin/Pharmacist atomic multi-medicine dispensing
export const dispensePrescription = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Verify prescription exists and is Pending
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (prescription.status !== 'Pending') {
      return res.status(409).json({
        success: false,
        message: 'Prescription is no longer pending.',
      });
    }

    const now = new Date();

    // 2. Pre-validate ALL medicines for active status, non-expired date, and sufficient stock
    for (const item of prescription.medicines) {
      const med = await Medicine.findById(item.medicineId);
      if (!med || !med.isActive) {
        return res.status(409).json({
          success: false,
          message: `Medicine '${item.medicineName}' is no longer active.`,
        });
      }

      if (med.expiryDate && new Date(med.expiryDate) <= now) {
        return res.status(409).json({
          success: false,
          message: 'Expired medicines cannot be dispensed.',
        });
      }

      if (med.quantity < item.quantity) {
        return res.status(409).json({
          success: false,
          message: 'Insufficient medicine stock available.',
        });
      }
    }

    // 3. Atomically deduct stock for every medicine with automatic rollback tracking
    const decrementedList = [];
    let deductionFailed = false;

    for (const item of prescription.medicines) {
      const updatedMed = await Medicine.findOneAndUpdate(
        {
          _id: item.medicineId,
          isActive: true,
          quantity: { $gte: item.quantity },
        },
        {
          $inc: { quantity: -item.quantity },
          $set: { updatedBy: req.user._id },
        },
        { new: true }
      );

      if (!updatedMed) {
        deductionFailed = true;
        break;
      }

      decrementedList.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
      });
    }

    // If any medicine deduction failed due to a concurrent race condition, rollback everything
    if (deductionFailed) {
      for (const item of decrementedList) {
        await Medicine.findByIdAndUpdate(item.medicineId, {
          $inc: { quantity: item.quantity },
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Insufficient medicine stock available.',
      });
    }

    // 4. Atomically transition Prescription to 'Dispensed'
    const dispensedByName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Pharmacist';
    const updatedPrescription = await Prescription.findOneAndUpdate(
      { _id: id, status: 'Pending' },
      {
        status: 'Dispensed',
        dispensedBy: req.user._id,
        dispensedByName,
        dispensedAt: new Date(),
      },
      { new: true }
    );

    // If prescription status changed concurrently, rollback all stock deductions
    if (!updatedPrescription) {
      for (const item of decrementedList) {
        await Medicine.findByIdAndUpdate(item.medicineId, {
          $inc: { quantity: item.quantity },
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Prescription is no longer pending.',
      });
    }

    // 5. Sync to Patient record if present
    try {
      const patientDoc = await Patient.findOne({ userId: updatedPrescription.patientId });
      if (patientDoc && Array.isArray(patientDoc.prescriptions)) {
        for (const item of updatedPrescription.medicines) {
          const match = patientDoc.prescriptions.find(
            (p) => p.medicine.toLowerCase().includes(item.medicineName.toLowerCase()) && !p.pharmacistGiven
          );
          if (match) {
            match.pharmacistGiven = true;
          }
        }
        await patientDoc.save();
      }
    } catch (syncErr) {
      console.error('Non-critical sync error to Patient document:', syncErr.message);
    }

    // Non-blocking notification hooks
    createNotification({
      recipient: updatedPrescription.patientId,
      title: 'Prescription Dispensed',
      message: `Your prescription has been dispensed by pharmacy (${dispensedByName}).`,
      type: 'prescription',
      priority: 'normal',
      link: '/patient/prescriptions',
      metadata: { prescriptionId: updatedPrescription._id },
      dedupeKey: `rx-dispense-${updatedPrescription._id}`
    });
    if (updatedPrescription.prescribedBy) {
      createNotification({
        recipient: updatedPrescription.prescribedBy,
        title: 'Prescription Dispensed',
        message: `Prescription for patient ${updatedPrescription.patientName} was dispensed by pharmacy.`,
        type: 'prescription',
        priority: 'normal',
        link: '/doctor/prescriptions',
        metadata: { prescriptionId: updatedPrescription._id },
        dedupeKey: `rx-dispense-doc-${updatedPrescription._id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Prescription dispensed successfully. Stock deducted for ${prescription.medicines.length} formulation(s).`,
      data: updatedPrescription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to dispense prescription',
      error: error.message,
    });
  }
};

// PATCH /api/prescriptions/:id/cancel - Doctor/Admin cancels pending prescription
export const cancelPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (prescription.status === 'Dispensed') {
      return res.status(409).json({
        success: false,
        message: 'Dispensed prescriptions cannot be cancelled.',
      });
    }

    const updatedPrescription = await Prescription.findOneAndUpdate(
      { _id: id, status: 'Pending' },
      { status: 'Cancelled' },
      { new: true }
    );

    if (!updatedPrescription) {
      return res.status(409).json({
        success: false,
        message: 'Prescription is no longer pending.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Prescription cancelled successfully',
      data: updatedPrescription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel prescription',
      error: error.message,
    });
  }
};
