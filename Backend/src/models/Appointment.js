import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['doctor', 'nurse'],
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      default: '',
      trim: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    providerName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      default: 'Consultation',
      trim: true,
    },
    reason: {
      type: String,
      default: 'Consultation',
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Rejected', 'Rescheduled', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for conflict resolution and scoped queries
appointmentSchema.index({ providerId: 1, date: 1, time: 1, status: 1 });
appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ providerId: 1, status: 1, createdAt: -1 });

// Pre-save hook to generate sequential human-readable ID if missing
appointmentSchema.pre('save', async function (next) {
  if (!this.id) {
    const prefix = this.type === 'doctor' ? 'APT-D' : 'APT-N';
    const count = await mongoose.model('Appointment').countDocuments();
    this.id = `${prefix}-${1001 + count}`;
  }
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
