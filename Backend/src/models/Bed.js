import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: [true, 'Room ID is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    bedNumber: {
      type: String,
      required: [true, 'Bed number is required'],
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED'],
      default: 'AVAILABLE',
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    patientName: {
      type: String,
      default: null,
      trim: true,
    },
    allocatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bedSchema.index({ roomId: 1, bedNumber: 1 }, { unique: true });
bedSchema.index({ patientId: 1, status: 1 });

const Bed = mongoose.models.Bed || mongoose.model('Bed', bedSchema);
export default Bed;
