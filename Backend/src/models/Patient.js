import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: true },
    dosage: { type: String, default: '1-0-1' },
    duration: { type: String, default: '7 days' },
    pharmacistGiven: { type: Boolean, default: false },
  },
  { _id: false }
);

const vitalsSchema = new mongoose.Schema(
  {
    temp: { type: String, default: '' },
    bp: { type: String, default: '' },
    heartRate: { type: String, default: '' },
    spo2: { type: String, default: '' },
    weight: { type: String, default: '' },
    height: { type: String, default: '' },
    bmi: { type: String, default: '' },
    bloodSugar: { type: String, default: '' },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recordedByName: { type: String, default: '' },
    recordedByRole: { type: String, default: '' },
    recordedAt: { type: Date, default: null },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    age: {
      type: Number,
      default: 0,
    },
    gender: {
      type: String,
      default: 'Male',
    },
    bloodGroup: {
      type: String,
      default: '',
    },
    room: {
      type: String,
      default: 'Outpatient',
    },
    status: {
      type: String,
      default: 'Outpatient',
    },
    admissionDate: {
      type: String,
      default: 'N/A',
    },
    medicalHistory: {
      type: [String],
      default: [],
    },
    prescriptions: {
      type: [prescriptionSchema],
      default: [],
    },
    nursingNotes: {
      type: String,
      default: '',
    },
    vitals: {
      type: vitalsSchema,
      default: () => ({
        temp: '',
        bp: '',
        heartRate: '',
        spo2: '',
        weight: '',
        height: '',
        bmi: '',
        bloodSugar: '',
        recordedBy: null,
        recordedByName: '',
        recordedByRole: '',
        recordedAt: null,
      }),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for friendly patient ID
patientSchema.virtual('id').get(function () {
  return this._id.toString();
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
