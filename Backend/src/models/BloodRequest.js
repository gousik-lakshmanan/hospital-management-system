import mongoose from 'mongoose';
import { ALLOWED_BLOOD_GROUPS } from './BloodStock.js';

const BloodRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requesterName: {
      type: String,
      required: true,
    },
    requesterRole: {
      type: String,
      enum: ['doctor', 'nurse', 'receptionist', 'patient'],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ALLOWED_BLOOD_GROUPS,
      required: true,
      index: true,
    },
    requestedUnits: {
      type: Number,
      required: true,
      min: 1,
    },
    approvedUnits: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Negotiated', 'Rejected'],
      default: 'Pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful query indexes
BloodRequestSchema.index({ requesterId: 1, status: 1 });
BloodRequestSchema.index({ bloodGroup: 1, status: 1 });
BloodRequestSchema.index({ createdAt: -1 });

// Database-level partial unique index:
// A user must have at most ONE 'Pending' request per blood group at any given time.
BloodRequestSchema.index(
  { requesterId: 1, bloodGroup: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'Pending',
    },
  }
);

const BloodRequest = mongoose.model('BloodRequest', BloodRequestSchema);

export default BloodRequest;
