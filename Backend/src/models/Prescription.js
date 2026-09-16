import mongoose from 'mongoose';

const prescribedMedicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      default: '1-0-1',
      trim: true,
    },
    frequency: {
      type: String,
      default: 'Twice daily',
      trim: true,
    },
    duration: {
      type: String,
      default: '5 days',
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
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
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prescribedByName: {
      type: String,
      required: true,
      trim: true,
    },
    medicines: {
      type: [prescribedMedicineSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Prescription must contain at least one medicine',
      },
    },
    diagnosis: {
      type: String,
      default: '',
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Dispensed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dispensedByName: {
      type: String,
      default: '',
    },
    dispensedAt: {
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

prescriptionSchema.index({ patientId: 1, status: 1 });
prescriptionSchema.index({ prescribedBy: 1, status: 1 });

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
