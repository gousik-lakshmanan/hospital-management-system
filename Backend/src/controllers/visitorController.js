import mongoose from 'mongoose';
import Visitor from '../models/Visitor.js';
import Patient from '../models/Patient.js';
import { createNotification } from '../services/notificationService.js';

// Helper to generate unique passId
const generateUniquePassId = async () => {
  let isUnique = false;
  let passId = '';
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    passId = `PASS-${randomNum}`;
    const existing = await Visitor.findOne({ passId });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  if (!isUnique) {
    passId = `PASS-${Date.now().toString().slice(-6)}`;
  }
  return passId;
};

// GET /api/visitors - List visitors
export const getVisitors = async (req, res) => {
  try {
    const { role } = req.user;

    if (role === 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'Pharmacists do not have access to visitor records.'
      });
    }

    let filter = {};

    if (role === 'patient') {
      // Find patient document linked to this user
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
      filter.patientId = patient._id;
    } else {
      // Query parameters for staff
      const { status, patientId, search, date } = req.query;

      if (status) {
        filter.status = status;
      }

      if (patientId) {
        if (mongoose.Types.ObjectId.isValid(patientId)) {
          filter.patientId = patientId;
        }
      }

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        filter.visitDate = { $gte: startOfDay, $lte: endOfDay };
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
          { visitorName: searchRegex },
          { passId: searchRegex },
          { patientName: searchRegex },
          { phone: searchRegex }
        ];
      }
    }

    const visitors = await Visitor.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    console.error('Error in getVisitors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch visitor records.',
      error: error.message
    });
  }
};

// GET /api/visitors/:id - Get single visitor pass
export const getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role === 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden.'
      });
    }

    let visitor = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      visitor = await Visitor.findById(id);
    } else {
      visitor = await Visitor.findOne({ passId: id });
    }

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor pass not found.'
      });
    }

    if (role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || visitor.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own visitor passes.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: visitor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitor pass.',
      error: error.message
    });
  }
};

// GET /api/visitors/patient/:patientId - Get visitors for a patient
export const getVisitorsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { role } = req.user;

    if (role === 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format.'
      });
    }

    if (role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || patient._id.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own visitor passes.'
        });
      }
    }

    const visitors = await Visitor.find({ patientId }).sort({ visitDate: -1 });

    return res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitors for patient.',
      error: error.message
    });
  }
};

// POST /api/visitors - Create new visitor pass
export const createVisitor = async (req, res) => {
  try {
    const {
      visitorName,
      phone,
      email,
      relationship,
      purpose,
      patientId,
      patientRoom,
      visitDate,
      notes
    } = req.body;

    if (!visitorName || !phone || !relationship || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required visitor fields: visitorName, phone, relationship, and patientId are required.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format.'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Referenced patient was not found.'
      });
    }

    const passId = await generateUniquePassId();

    const newVisitor = await Visitor.create({
      passId,
      visitorName: visitorName.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : '',
      relationship: relationship.trim(),
      purpose: purpose ? purpose.trim() : 'General Visit',
      patientId: patient._id,
      patientName: patient.name,
      patientRoom: patientRoom || patient.room || patient.ward || 'Unassigned',
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      checkInTime: null,
      checkOutTime: null,
      status: 'Expected',
      registeredBy: req.user._id,
      registeredByName: req.user.name || 'Staff Member',
      notes: notes ? notes.trim() : ''
    });

    if (patient.userId) {
      createNotification({
        recipient: patient.userId,
        title: 'Visitor Pass Issued',
        message: `Visitor pass issued for ${newVisitor.visitorName} (${newVisitor.relationship}) to visit you.`,
        type: 'visitor',
        priority: 'normal',
        link: '/patient/visitors',
        metadata: { visitorId: newVisitor._id, passId: newVisitor.passId },
        dedupeKey: `visitor-pass-${newVisitor._id}`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Visitor pass created successfully.',
      data: newVisitor
    });
  } catch (error) {
    console.error('Error in createVisitor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create visitor pass.',
      error: error.message
    });
  }
};

// PATCH /api/visitors/:id/check-in - Check in visitor (Expected -> Checked In)
export const checkInVisitor = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { passId: id };
    const currentVisitor = await Visitor.findOne(filter);

    if (!currentVisitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor pass not found.'
      });
    }

    if (currentVisitor.status !== 'Expected') {
      return res.status(409).json({
        success: false,
        message: `Cannot check in visitor with current status: "${currentVisitor.status}". Only "Expected" visitors can be checked in.`
      });
    }

    // Atomic update
    const updated = await Visitor.findOneAndUpdate(
      { ...filter, status: 'Expected' },
      {
        $set: {
          status: 'Checked In',
          checkInTime: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Concurrent modification conflict: Visitor status has changed.'
      });
    }

    // Non-blocking notification to patient
    try {
      const patientDoc = await Patient.findById(updated.patientId);
      if (patientDoc && patientDoc.userId) {
        createNotification({
          recipient: patientDoc.userId,
          title: 'Visitor Arrived',
          message: `Your visitor ${updated.visitorName} has checked in.`,
          type: 'visitor',
          priority: 'normal',
          link: '/patient/visitors',
          metadata: { visitorId: updated._id, passId: updated.passId },
          dedupeKey: `visitor-checkin-${updated._id}`
        });
      }
    } catch (nErr) {}

    return res.status(200).json({
      success: true,
      message: 'Visitor checked in successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check in visitor.',
      error: error.message
    });
  }
};

// PATCH /api/visitors/:id/check-out - Check out visitor (Checked In -> Checked Out)
export const checkOutVisitor = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { passId: id };
    const currentVisitor = await Visitor.findOne(filter);

    if (!currentVisitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor pass not found.'
      });
    }

    if (currentVisitor.status !== 'Checked In') {
      return res.status(409).json({
        success: false,
        message: `Cannot check out visitor with current status: "${currentVisitor.status}". Only "Checked In" visitors can be checked out.`
      });
    }

    // Atomic update
    const updated = await Visitor.findOneAndUpdate(
      { ...filter, status: 'Checked In' },
      {
        $set: {
          status: 'Checked Out',
          checkOutTime: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Concurrent modification conflict: Visitor status has changed.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check out visitor.',
      error: error.message
    });
  }
};

// PATCH /api/visitors/:id/cancel - Cancel visitor pass
export const cancelVisitor = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { passId: id };
    const currentVisitor = await Visitor.findOne(filter);

    if (!currentVisitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor pass not found.'
      });
    }

    if (currentVisitor.status === 'Cancelled' || currentVisitor.status === 'Checked Out') {
      return res.status(409).json({
        success: false,
        message: `Cannot cancel visitor with status "${currentVisitor.status}".`
      });
    }

    const updated = await Visitor.findOneAndUpdate(
      { ...filter, status: { $in: ['Expected', 'Checked In'] } },
      {
        $set: {
          status: 'Cancelled'
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Concurrent modification conflict: Visitor status has changed.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Visitor pass cancelled successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel visitor pass.',
      error: error.message
    });
  }
};

// PATCH /api/visitors/:id - Update visitor details
export const updateVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { visitorName, phone, email, relationship, purpose, notes, patientRoom } = req.body;

    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { passId: id };
    const visitor = await Visitor.findOne(filter);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor pass not found.'
      });
    }

    if (visitorName) visitor.visitorName = visitorName.trim();
    if (phone) visitor.phone = phone.trim();
    if (email !== undefined) visitor.email = email.trim().toLowerCase();
    if (relationship) visitor.relationship = relationship.trim();
    if (purpose) visitor.purpose = purpose.trim();
    if (notes !== undefined) visitor.notes = notes.trim();
    if (patientRoom) visitor.patientRoom = patientRoom.trim();

    await visitor.save();

    return res.status(200).json({
      success: true,
      message: 'Visitor details updated successfully.',
      data: visitor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update visitor pass.',
      error: error.message
    });
  }
};
