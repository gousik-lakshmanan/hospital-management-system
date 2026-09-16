import Room from '../models/Room.js';
import Bed from '../models/Bed.js';

export const INITIAL_ROOMS = [
  {
    roomId: 'WD-201',
    roomName: 'Ward A',
    roomType: 'General Ward',
    capacity: 10,
    isActive: true,
  },
  {
    roomId: 'EMR-101',
    roomName: 'Emergency',
    roomType: 'Emergency',
    capacity: 10,
    isActive: true,
  },
  {
    roomId: 'ICU-101',
    roomName: 'ICU',
    roomType: 'Intensive Care',
    capacity: 10,
    isActive: true,
  },
  {
    roomId: 'PS-101',
    roomName: 'Private Suite 1',
    roomType: 'Private Suite',
    capacity: 1,
    isActive: true,
  },
  {
    roomId: 'PS-102',
    roomName: 'Private Suite 2',
    roomType: 'Private Suite',
    capacity: 1,
    isActive: true,
  },
  {
    roomId: 'PS-103',
    roomName: 'Private Suite 3',
    roomType: 'Private Suite',
    capacity: 1,
    isActive: true,
  },
];

export const seedRoomsAndBeds = async () => {
  try {
    for (const roomData of INITIAL_ROOMS) {
      await Room.findOneAndUpdate(
        { roomId: roomData.roomId },
        { $setOnInsert: roomData },
        { upsert: true, new: true }
      );

      for (let i = 1; i <= roomData.capacity; i++) {
        const bedNumber = `${roomData.roomId}-${String(i).padStart(2, '0')}`;
        await Bed.findOneAndUpdate(
          { roomId: roomData.roomId, bedNumber },
          {
            $setOnInsert: {
              roomId: roomData.roomId,
              roomName: roomData.roomName,
              bedNumber,
              status: 'AVAILABLE',
              patientId: null,
              patientName: null,
              allocatedAt: null,
            },
          },
          { upsert: true, new: true }
        );
      }
    }
    console.log('Rooms and Beds seeded/verified successfully (6 rooms, 33 beds).');
  } catch (error) {
    console.error('Error seeding rooms and beds:', error);
  }
};
