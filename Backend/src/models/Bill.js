import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Room & Bed', 'Doctor Consultation', 'Pharmacy & Medication', 'Lab Test', 'Procedure', 'Other'],
    default: 'Other'
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  }
}, { _id: true });

const paymentRecordSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than 0']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Insurance', 'Other'],
    default: 'Cash'
  },
  transactionRef: {
    type: String,
    default: '',
    trim: true
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordedByName: {
    type: String,
    required: true
  }
}, { _id: true });

const billSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
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
  patientEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  items: {
    type: [billItemSchema],
    default: []
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Cancelled'],
    default: 'Unpaid'
  },
  paymentMethod: {
    type: String,
    default: 'Unpaid'
  },
  paymentHistory: {
    type: [paymentRecordSchema],
    default: []
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

billSchema.index({ patientId: 1, createdAt: -1 });
billSchema.index({ paymentStatus: 1 });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;

