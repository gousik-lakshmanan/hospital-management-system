import mongoose from 'mongoose';
import BedRequest from '../models/BedRequest.js';
import Bed from '../models/Bed.js';
import Room from '../models/Room.js';
import Patient from '../models/Patient.js';

// POST /api/bed-requests - Patient submits a bed request for a section
export const createBedRequest = async (req, res) => {
  try {
    const { sectionId } = req.body;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Section ID is required',
      });
    }

    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can submit bed requests',
      });
    }

    // 1. Verify section exists and is active
    const room = await Room.findOne({ roomId: sectionId.toUpperCase(), isActive: true });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Section with ID '${sectionId}' not found`,
      });
    }

    const requesterId = req.user._id;
    const requesterName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Patient';

    // 2. Check if patient already has a pending bed request
    const existingPendingRequest = await BedRequest.findOne({
      requesterId,
      status: 'pending',
    });
    if (existingPendingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending bed request.',
      });
    }

    // 3. Check if patient already has an occupied bed in the hospital
    const existingOccupiedBed = await Bed.findOne({
      patientId: requesterId,
      status: 'OCCUPIED',
    });
    if (existingOccupiedBed) {
      return res.status(409).json({
        success: false,
        message: 'This patient already has an occupied bed.',
      });
    }

    // 4. Create new bed request
    const newBedRequest = new BedRequest({
      requesterId,
      requesterName,
      requesterRole: 'patient',
      sectionId: room.roomId,
      sectionName: room.roomName,
      requestedAt: new Date(),
      status: 'pending',
    });

    await newBedRequest.save();

    return res.status(201).json({
      success: true,
      message: `Bed request for ${room.roomName} submitted successfully`,
      data: newBedRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create bed request',
      error: error.message,
    });
  }
};

// GET /api/bed-requests/my - Patient views own bed requests
export const getMyBedRequests = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to patients',
      });
    }

    const requests = await BedRequest.find({ requesterId: req.user._id }).sort({ requestedAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your bed requests',
      error: error.message,
    });
  }
};

// GET /api/bed-requests - Admin views all bed requests
export const getAllBedRequests = async (req, res) => {
  try {
    const requests = await BedRequest.find().sort({ requestedAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bed requests',
      error: error.message,
    });
  }
};

// PATCH /api/bed-requests/:id/approve - Admin approves a bed request with concurrency safety
export const approveBedRequest = async (req, res) => {
  const { id: requestId } = req.params;
  const { bedId } = req.body;

  if (!bedId) {
    return res.status(400).json({
      success: false,
      message: 'Bed ID is required to approve the request',
    });
  }

  try {
    // 1. Check if request exists and is pending
    const initialRequest = await BedRequest.findById(requestId);
    if (!initialRequest) {
      return res.status(404).json({
        success: false,
        message: 'Bed request not found',
      });
    }

    if (initialRequest.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: 'Bed request is no longer pending.',
      });
    }

    // 2. Check if patient already has an occupied bed in the hospital
    const existingOccupiedBed = await Bed.findOne({
      patientId: initialRequest.requesterId,
      status: 'OCCUPIED',
    });
    if (existingOccupiedBed) {
      return res.status(409).json({
        success: false,
        message: 'This patient already has an occupied bed.',
      });
    }

    // 3. Atomically claim the bed if it belongs to the requested section and is AVAILABLE
    const claimedBed = await Bed.findOneAndUpdate(
      { _id: bedId, roomId: initialRequest.sectionId, status: 'AVAILABLE' },
      {
        status: 'OCCUPIED',
        patientId: initialRequest.requesterId,
        patientName: initialRequest.requesterName,
        allocatedAt: new Date(),
      },
      { new: true }
    );

    if (!claimedBed) {
      return res.status(409).json({
        success: false,
        message: 'This bed is no longer available. Please select another available bed.',
      });
    }

    // 4. Atomically transition BedRequest from 'pending' to 'approved'
    const updatedRequest = await BedRequest.findOneAndUpdate(
      { _id: requestId, status: 'pending' },
      {
        status: 'approved',
        assignedBedId: claimedBed._id,
        assignedBedNumber: claimedBed.bedNumber,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // If request was approved/rejected concurrently, rollback the claimed bed
    if (!updatedRequest) {
      await Bed.findByIdAndUpdate(claimedBed._id, {
        status: 'AVAILABLE',
        patientId: null,
        patientName: null,
        allocatedAt: null,
      });

      return res.status(409).json({
        success: false,
        message: 'Bed request is no longer pending.',
      });
    }

    // Update patient clinical record status/room
    await Patient.findOneAndUpdate(
      { userId: initialRequest.requesterId },
      { status: 'Admitted', room: `${claimedBed.roomName} - ${claimedBed.bedNumber}` }
    );

    return res.status(200).json({
      success: true,
      message: `Bed request approved. Assigned Bed ${claimedBed.bedNumber} to ${initialRequest.requesterName}.`,
      data: {
        request: updatedRequest,
        bed: claimedBed,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve bed request',
      error: error.message,
    });
  }
};

// PATCH /api/bed-requests/:id/reject - Admin rejects a bed request
export const rejectBedRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;

    const request = await BedRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Bed request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: 'Bed request is no longer pending.',
      });
    }

    const updatedRequest = await BedRequest.findOneAndUpdate(
      { _id: requestId, status: 'pending' },
      {
        status: 'rejected',
        assignedBedId: null,
        assignedBedNumber: null,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(409).json({
        success: false,
        message: 'Bed request is no longer pending.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Bed request rejected successfully',
      data: updatedRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject bed request',
      error: error.message,
    });
  }
};
