import mongoose from 'mongoose';
import { ALLOWED_BLOOD_GROUPS } from './BloodStock.js';

const BloodDonorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ALLOWED_BLOOD_GROUPS,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    totalDonations: {
      type: Number,
      min: 0,
      default: 0,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registeredByName: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BloodDonorSchema.index({ bloodGroup: 1 });
BloodDonorSchema.index({ phone: 1 });

const BloodDonor = mongoose.model('BloodDonor', BloodDonorSchema);

export default BloodDonor;
