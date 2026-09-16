import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Tablet',
        'Capsule',
        'Syrup',
        'Injection',
        'Cream',
        'Ointment',
        'Drops',
        'Inhaler',
        'Powder',
        'Other',
      ],
      default: 'Tablet',
    },
    manufacturer: {
      type: String,
      default: '',
      trim: true,
    },
    strength: {
      type: String,
      default: '',
      trim: true,
    },
    dosageForm: {
      type: String,
      default: 'Tablet',
      trim: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      min: [0, 'Reorder level cannot be negative'],
      default: 10,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

medicineSchema.index({ name: 1, genericName: 1 });
medicineSchema.index({ batchNumber: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ expiryDate: 1 });

const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
export default Medicine;
