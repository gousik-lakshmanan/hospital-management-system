import mongoose from 'mongoose';

const bedRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
      index: true,
    },
    requesterName: {
      type: String,
      required: [true, 'Requester name is required'],
      trim: true,
    },
    requesterRole: {
      type: String,
      required: [true, 'Requester role is required'],
      enum: ['patient'],
      default: 'patient',
    },
    sectionId: {
      type: String,
      required: [true, 'Section ID is required'],
      trim: true,
      uppercase: true,
    },
    sectionName: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    assignedBedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      default: null,
    },
    assignedBedNumber: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bedRequestSchema.index({ requesterId: 1, status: 1 });

const BedRequest = mongoose.models.BedRequest || mongoose.model('BedRequest', bedRequestSchema);
export default BedRequest;
