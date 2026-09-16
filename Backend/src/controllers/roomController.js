import Room from '../models/Room.js';
import Bed from '../models/Bed.js';

// GET /api/rooms - Get all active rooms with dynamic stats
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ roomId: 1 });
    
    // Dynamically calculate capacity, occupied, available from Bed documents
    const roomStatsPromises = rooms.map(async (room) => {
      const totalBeds = await Bed.countDocuments({ roomId: room.roomId });
      const occupiedBeds = await Bed.countDocuments({ roomId: room.roomId, status: 'OCCUPIED' });
      const availableBeds = totalBeds - occupiedBeds;

      return {
        _id: room._id,
        roomId: room.roomId,
        roomName: room.roomName,
        roomType: room.roomType,
        capacity: totalBeds || room.capacity,
        occupied: occupiedBeds,
        available: availableBeds >= 0 ? availableBeds : 0,
        isActive: room.isActive,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      };
    });

    const populatedRooms = await Promise.all(roomStatsPromises);

    return res.status(200).json({
      success: true,
      count: populatedRooms.length,
      data: populatedRooms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message,
    });
  }
};

// GET /api/rooms/:roomId/beds - Get all beds for a specific room
export const getRoomBeds = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId: roomId.toUpperCase(), isActive: true });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' not found`,
      });
    }

    const beds = await Bed.find({ roomId: room.roomId }).sort({ bedNumber: 1 });

    return res.status(200).json({
      success: true,
      room: {
        roomId: room.roomId,
        roomName: room.roomName,
        roomType: room.roomType,
      },
      count: beds.length,
      data: beds,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch beds for room',
      error: error.message,
    });
  }
};

// GET /api/rooms/:roomId/beds/available - Get available beds for a specific room
export const getAvailableBeds = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId: roomId.toUpperCase(), isActive: true });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with ID '${roomId}' not found`,
      });
    }

    const availableBeds = await Bed.find({ roomId: room.roomId, status: 'AVAILABLE' }).sort({ bedNumber: 1 });

    return res.status(200).json({
      success: true,
      room: {
        roomId: room.roomId,
        roomName: room.roomName,
        roomType: room.roomType,
      },
      count: availableBeds.length,
      data: availableBeds,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available beds for room',
      error: error.message,
    });
  }
};
