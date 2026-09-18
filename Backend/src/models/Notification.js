import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient'],
      required: true
    },
    type: {
      type: String,
      enum: [
        'APPOINTMENT',
        'BED_REQUEST',
        'BED_ALLOCATION',
        'PRESCRIPTION',
        'PHARMACY',
        'BLOOD_REQUEST',
        'BLOOD_STOCK',
        'VISITOR',
        'BILLING',
        'DIET_PLAN',
        'SYSTEM'
      ],
      required: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    entityType: {
      type: String,
      default: null
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL'
    },
    link: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    dedupeKey: {
      type: String,
      default: null,
      sparse: true,
      unique: true
    }
  },
  {
    timestamps: true
  }
);

// Performance compound indexes
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
