import mongoose from 'mongoose';
import BloodRequest from '../models/BloodRequest.js';
import BloodStock, { ALLOWED_BLOOD_GROUPS } from '../models/BloodStock.js';

// POST /api/blood-requests - Doctor, Nurse, Receptionist, Patient creates blood request
export const createBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, requestedUnits } = req.body;

    // RBAC Guard: Only doctor, nurse, receptionist, patient can create requests
    const allowedRoles = ['doctor', 'nurse', 'receptionist', 'patient'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Administrators and Pharmacists manage blood inventory rather than creating blood requests.',
      });
    }

    // Validate bloodGroup
    if (!bloodGroup || !ALLOWED_BLOOD_GROUPS.includes(bloodGroup.trim())) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Allowed groups: ${ALLOWED_BLOOD_GROUPS.join(', ')}`,
      });
    }
    const cleanGroup = bloodGroup.trim();

    // Validate requestedUnits
    const parsedUnits = parseInt(requestedUnits, 10);
    if (isNaN(parsedUnits) || parsedUnits < 1) {
      return res.status(400).json({
        success: false,
        message: 'Requested units must be an integer of at least 1.',
      });
    }

    // Application-level duplicate Pending request check
    const existingPending = await BloodRequest.findOne({
      requesterId: req.user._id,
      bloodGroup: cleanGroup,
      status: 'Pending',
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'Your blood request for this blood group is already pending.',
      });
    }

    // Live MongoDB stock re-verification at submission time
    const stock = await BloodStock.findOne({ bloodGroup: cleanGroup });
    const availableUnits = stock ? stock.units : 0;

    if (availableUnits < parsedUnits) {
      return res.status(409).json({
        success: false,
        message: 'Insufficient blood stock for this request.',
        availableUnits,
      });
    }

    const requesterName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Hospital Requester';

    // Create new BloodRequest with status: 'Pending', approvedUnits: 0 (ZERO premature stock deduction)
    const newRequest = new BloodRequest({
      requesterId: req.user._id,
      requesterName,
      requesterRole: req.user.role,
      bloodGroup: cleanGroup,
      requestedUnits: parsedUnits,
      approvedUnits: 0,
      status: 'Pending',
    });

    try {
      await newRequest.save();
    } catch (saveErr) {
      // Catch MongoDB partial unique index error (code 11000) for concurrency safety
      if (saveErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Your blood request for this blood group is already pending.',
        });
      }
      throw saveErr;
    }

    return res.status(201).json({
      success: true,
      message: 'Blood request created successfully and dispatched for Administrator review.',
      data: {
        _id: newRequest._id,
        id: `REQ-${newRequest._id.toString().slice(-6).toUpperCase()}`,
        requesterId: newRequest.requesterId,
        requesterName: newRequest.requesterName,
        requesterRole: newRequest.requesterRole,
        bloodGroup: newRequest.bloodGroup,
        requestedUnits: newRequest.requestedUnits,
        approvedUnits: newRequest.approvedUnits,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
        updatedAt: newRequest.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create blood request.',
      error: error.message,
    });
  }
};

// GET /api/blood-requests/my - Get authenticated user's own blood requests
export const getMyBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requesterId: req.user._id }).sort({ createdAt: -1 });

    const formattedRequests = requests.map((r) => ({
      _id: r._id,
      id: `REQ-${r._id.toString().slice(-6).toUpperCase()}`,
      requesterId: r.requesterId,
      requesterName: r.requesterName,
      requesterRole: r.requesterRole,
      bloodGroup: r.bloodGroup,
      requestedUnits: r.requestedUnits,
      approvedUnits: r.approvedUnits,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      data: formattedRequests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your blood requests.',
      error: error.message,
    });
  }
};

// GET /api/blood-requests - Admin views all blood unit requests
export const getAllBloodRequests = async (req, res) => {
  try {
    const { status, bloodGroup } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (bloodGroup && ALLOWED_BLOOD_GROUPS.includes(bloodGroup.trim())) {
      filter.bloodGroup = bloodGroup.trim();
    }

    const requests = await BloodRequest.find(filter).sort({ createdAt: -1 });

    const formattedRequests = requests.map((r) => ({
      _id: r._id,
      id: `REQ-${r._id.toString().slice(-6).toUpperCase()}`,
      requesterId: r.requesterId,
      requesterName: r.requesterName,
      requesterRole: r.requesterRole,
      bloodGroup: r.bloodGroup,
      requestedUnits: r.requestedUnits,
      approvedUnits: r.approvedUnits,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      data: formattedRequests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch all blood requests.',
      error: error.message,
    });
  }
};

// GET /api/blood-requests/:id - Request owner or Admin views details
export const getBloodRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }

    // Data isolation check: Only owner or admin can view
    const isOwner = request.requesterId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own blood request.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: request._id,
        id: `REQ-${request._id.toString().slice(-6).toUpperCase()}`,
        requesterId: request.requesterId,
        requesterName: request.requesterName,
        requesterRole: request.requesterRole,
        bloodGroup: request.bloodGroup,
        requestedUnits: request.requestedUnits,
        approvedUnits: request.approvedUnits,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blood request details.',
      error: error.message,
    });
  }
};

// PATCH /api/blood-requests/:id/approve - Admin approves pending request atomically
export const approveBloodRequest = async (req, res) => {
  const { id } = req.params;

  let session = null;
  let useTransactions = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransactions = true;
  } catch (sessionErr) {
    // If MongoDB replica set is not configured, fallback gracefully with strict atomic condition rollback
    useTransactions = false;
  }

  try {
    if (useTransactions) {
      // Step 1: Find request inside transaction
      const request = await BloodRequest.findOne({ _id: id, status: 'Pending' }).session(session);
      if (!request) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: 'Blood request is no longer pending.',
        });
      }

      // Step 2: Atomic conditional stock decrement
      const updatedStock = await BloodStock.findOneAndUpdate(
        { bloodGroup: request.bloodGroup, units: { $gte: request.requestedUnits } },
        { $inc: { units: -request.requestedUnits }, $set: { updatedBy: req.user._id } },
        { new: true, session }
      );

      if (!updatedStock) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: 'Insufficient blood stock to approve this request.',
        });
      }

      // Step 3: Conditionally update request status to 'Approved'
      const updatedRequest = await BloodRequest.findOneAndUpdate(
        { _id: id, status: 'Pending' },
        {
          $set: {
            status: 'Approved',
            approvedUnits: request.requestedUnits,
            updatedAt: new Date(),
          },
        },
        { new: true, session }
      );

      if (!updatedRequest) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: 'Blood request is no longer pending.',
        });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: `Blood request approved for ${request.requestedUnits} units of ${request.bloodGroup}.`,
        data: updatedRequest,
      });
    } else {
      // Strict 2-phase conditional update with rollback safeguard for non-transactional setups
      const request = await BloodRequest.findOne({ _id: id, status: 'Pending' });
      if (!request) {
        return res.status(409).json({
          success: false,
          message: 'Blood request is no longer pending.',
        });
      }

      // 1. Atomically decrement stock
      const updatedStock = await BloodStock.findOneAndUpdate(
        { bloodGroup: request.bloodGroup, units: { $gte: request.requestedUnits } },
        { $inc: { units: -request.requestedUnits }, $set: { updatedBy: req.user._id } },
        { new: true }
      );

      if (!updatedStock) {
        return res.status(409).json({
          success: false,
          message: 'Insufficient blood stock to approve this request.',
        });
      }

      // 2. Atomically transition request
      const updatedRequest = await BloodRequest.findOneAndUpdate(
        { _id: id, status: 'Pending' },
        {
          $set: {
            status: 'Approved',
            approvedUnits: request.requestedUnits,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      // If concurrent collision occurred, rollback stock deduction
      if (!updatedRequest) {
        await BloodStock.findOneAndUpdate(
          { bloodGroup: request.bloodGroup },
          { $inc: { units: request.requestedUnits } }
        );
        return res.status(409).json({
          success: false,
          message: 'Blood request is no longer pending.',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Blood request approved for ${request.requestedUnits} units of ${request.bloodGroup}.`,
        data: updatedRequest,
      });
    }
  } catch (error) {
    if (useTransactions && session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (e) {}
    }
    if (
      error.code === 112 ||
      error.code === 11000 ||
      error.errorLabels?.includes('TransientTransactionError') ||
      error.message?.includes('WriteConflict') ||
      error.message?.includes('Transaction')
    ) {
      return res.status(409).json({
        success: false,
        message: 'Blood request is no longer pending.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to approve blood request.',
      error: error.message,
    });
  }
};

// PATCH /api/blood-requests/:id/negotiate - Admin negotiates approved quantity atomically
export const negotiateBloodRequest = async (req, res) => {
  const { id } = req.params;
  const { approvedUnits } = req.body;

  const parsedUnits = parseInt(approvedUnits, 10);
  if (isNaN(parsedUnits) || parsedUnits < 1) {
    return res.status(400).json({
      success: false,
      message: 'Negotiated approved units must be at least 1.',
    });
  }

  let session = null;
  let useTransactions = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransactions = true;
  } catch (sessionErr) {
    useTransactions = false;
  }

  try {
    if (useTransactions) {
      // Step 1: Find request inside transaction
      const request = await BloodRequest.findOne({ _id: id, status: 'Pending' }).session(session);
      if (!request) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: 'Blood request is no longer pending.',
        });
      }

      if (parsedUnits > request.requestedUnits) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Negotiated units cannot exceed requested units (${request.requestedUnits}).`,
        });
      }

      // Step 2: Atomic conditional stock decrement for negotiated units
      const updatedStock = await BloodStock.findOneAndUpdate(
        { bloodGroup: request.bloodGroup, units: { $gte: parsedUnits } },
        { $inc: { units: -parsedUnits }, $set: { updatedBy: req.user._id } },
        { new: true, session }
      );

      if (!updatedStock) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: 'Insufficient blood stock to approve this quantity.',
        });
      }

      // Step 3: Conditionally update request status to 'Negotiated'
      const updatedRequest = await BloodRequest.findOneAndUpdate(
        { _id: id, status: 'Pending' },
        {
          $set: {
            status: 'Negotiated',
            approvedUnits: parsedUnits,
            updatedAt: new Date(),
          },
        },
        { new: true, session }
      );

      if (!updatedRequest) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: 'Blood request is no longer pending.',
        });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: `Blood request negotiated: ${parsedUnits} units of ${request.bloodGroup} approved.`,
        data: updatedRequest,
      });
    } else {
      // Non-transactional 2-phase conditional rollback fallback
      const request = await BloodRequest.findOne({ _id: id, status: 'Pending' });
      if (!request) {
        return res.status(409).json({
          success: false,
          message: 'Blood request is no longer pending.',
        });
      }

      if (parsedUnits > request.requestedUnits) {
        return res.status(400).json({
          success: false,
          message: `Negotiated units cannot exceed requested units (${request.requestedUnits}).`,
        });
      }

      // 1. Atomically decrement stock
      const updatedStock = await BloodStock.findOneAndUpdate(
        { bloodGroup: request.bloodGroup, units: { $gte: parsedUnits } },
        { $inc: { units: -parsedUnits }, $set: { updatedBy: req.user._id } },
        { new: true }
      );

      if (!updatedStock) {
        return res.status(409).json({
          success: false,
          message: 'Insufficient blood stock to approve this quantity.',
        });
      }

      // 2. Conditionally update request
      const updatedRequest = await BloodRequest.findOneAndUpdate(
        { _id: id, status: 'Pending' },
        {
          $set: {
            status: 'Negotiated',
            approvedUnits: parsedUnits,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      // If concurrent collision occurred, rollback stock deduction
      if (!updatedRequest) {
        await BloodStock.findOneAndUpdate(
          { bloodGroup: request.bloodGroup },
          { $inc: { units: parsedUnits } }
        );
        return res.status(409).json({
          success: false,
          message: 'Blood request is no longer pending.',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Blood request negotiated: ${parsedUnits} units of ${request.bloodGroup} approved.`,
        data: updatedRequest,
      });
    }
  } catch (error) {
    if (useTransactions && session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (e) {}
    }
    if (
      error.code === 112 ||
      error.code === 11000 ||
      error.errorLabels?.includes('TransientTransactionError') ||
      error.message?.includes('WriteConflict') ||
      error.message?.includes('Transaction')
    ) {
      return res.status(409).json({
        success: false,
        message: 'Blood request is no longer pending.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to negotiate blood request.',
      error: error.message,
    });
  }
};

// PATCH /api/blood-requests/:id/reject - Admin rejects pending blood request
export const rejectBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Conditionally update from 'Pending' to 'Rejected' (Zero stock deduction)
    const updatedRequest = await BloodRequest.findOneAndUpdate(
      { _id: id, status: 'Pending' },
      {
        $set: {
          status: 'Rejected',
          approvedUnits: 0,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(409).json({
        success: false,
        message: 'Blood request is no longer pending.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Blood request rejected.',
      data: updatedRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject blood request.',
      error: error.message,
    });
  }
};
