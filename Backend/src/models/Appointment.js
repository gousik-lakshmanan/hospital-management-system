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
      enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Scheduled',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

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
