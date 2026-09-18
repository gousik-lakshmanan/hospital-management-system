import Bed from '../models/Bed.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import notificationService from '../services/notificationService.js';

// POST /api/beds/allocate - Admin direct allocation of a bed to a patient
export const allocateBed = async (req, res) => {
  try {
    const { bedId, patientId } = req.body;

    if (!bedId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Bed ID and Patient ID are required',
      });
    }

    // 1. Validate patient exists and has role 'patient' (check User _id or Patient doc userId)
    let patientUser = await User.findById(patientId);
    if (!patientUser) {
      const patientDoc = await Patient.findById(patientId);
      if (patientDoc && patientDoc.userId) {
        patientUser = await User.findById(patientDoc.userId);
      }
    }

    if (!patientUser || patientUser.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient selected. User must have patient role.',
      });
    }

    const patientName = `${patientUser.firstName} ${patientUser.lastName}`.trim();

    // 2. Check if patient already has an occupied bed in the hospital
    const existingBed = await Bed.findOne({ patientId: patientUser._id, status: 'OCCUPIED' });
    if (existingBed) {
      return res.status(409).json({
        success: false,
        message: 'This patient already has an occupied bed.',
      });
    }

    // 3. Atomically allocate the bed if it is currently AVAILABLE
    const updatedBed = await Bed.findOneAndUpdate(
      { _id: bedId, status: 'AVAILABLE' },
      {
        status: 'OCCUPIED',
        patientId: patientUser._id,
        patientName,
        allocatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedBed) {
      return res.status(409).json({
        success: false,
        message: 'This bed is no longer available. Please select another available bed.',
      });
    }

    // Update patient status/room if Patient record exists
    await Patient.findOneAndUpdate(
      { userId: patientUser._id },
      { status: 'Admitted', room: `${updatedBed.roomName} - ${updatedBed.bedNumber}` }
    );

    // Notify patient of direct bed allocation
    await notificationService.createNotification({
      recipientId: patientUser._id,
      recipientRole: 'patient',
      type: 'BED_ALLOCATION',
      title: 'Bed Allocated',
      message: `Bed ${updatedBed.bedNumber} in ${updatedBed.roomName} has been allocated to you.`,
      entityType: 'Bed',
      entityId: updatedBed._id,
      priority: 'HIGH',
      dedupeKey: `bed-alloc-${updatedBed._id}-${patientUser._id}`
    });

    return res.status(200).json({
      success: true,
      message: `Bed ${updatedBed.bedNumber} allocated to ${patientName} successfully`,
      data: updatedBed,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to allocate bed',
      error: error.message,
    });
  }
};

// PATCH /api/beds/:id/release - Admin releases an occupied bed
export const releaseBed = async (req, res) => {
  try {
    const { id } = req.params;

    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    if (bed.status === 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Bed ${bed.bedNumber} is already available`,
      });
    }

    const previousPatientId = bed.patientId;

    bed.status = 'AVAILABLE';
    bed.patientId = null;
    bed.patientName = null;
    bed.allocatedAt = null;
    await bed.save();

    if (previousPatientId) {
      await Patient.findOneAndUpdate(
        { userId: previousPatientId },
        { status: 'Discharged', room: 'Discharged' }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Bed ${bed.bedNumber} released successfully and is now available`,
      data: bed,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to release bed',
      error: error.message,
    });
  }
};
