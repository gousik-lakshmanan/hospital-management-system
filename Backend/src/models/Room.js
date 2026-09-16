import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: [true, 'Room ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    roomType: {
      type: String,
      required: [true, 'Room type is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
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

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
export default Room;
