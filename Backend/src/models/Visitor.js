import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  passId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  visitorName: {
    type: String,
    required: [true, 'Visitor name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  relationship: {
    type: String,
    required: [true, 'Relationship to patient is required'],
    trim: true
  },
  purpose: {
    type: String,
    default: 'General Visit',
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required']
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  patientRoom: {
    type: String,
    default: 'Unassigned',
    trim: true
  },
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
    default: Date.now
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Expected', 'Checked In', 'Checked Out', 'Cancelled'],
    default: 'Expected'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredByName: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

visitorSchema.index({ patientId: 1, visitDate: -1 });
visitorSchema.index({ status: 1 });

const Visitor = mongoose.model('Visitor', visitorSchema);
export default Visitor;

