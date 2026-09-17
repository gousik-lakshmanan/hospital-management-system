import mongoose from 'mongoose';

const ALLOWED_BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

const BloodStockSchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      enum: ALLOWED_BLOOD_GROUPS,
      required: true,
      unique: true,
    },
    units: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

BloodStockSchema.methods.getStatus = function () {
  if (this.units <= 0) return 'Out of Stock';
  if (this.units <= 2) return 'Emergency Alert';
  if (this.units <= 5) return 'Low Stock';
  return 'Normal';
};

const BloodStock = mongoose.model('BloodStock', BloodStockSchema);

export default BloodStock;
export { ALLOWED_BLOOD_GROUPS };
