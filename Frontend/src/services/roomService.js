import api from './api';

export const roomService = {
  // GET /api/rooms - Get all active rooms with dynamically calculated live stats
  getRooms: async () => {
    const response = await api.get('/rooms');
    return response.data;
  },

  // GET /api/rooms/:roomId/beds - Get all beds for a specific room
  getRoomBeds: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}/beds`);
    return response.data;
  },

  // GET /api/rooms/:roomId/beds/available - Get only available beds for a room
  getAvailableBeds: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}/beds/available`);
    return response.data;
  },

  // POST /api/beds/allocate - Admin direct allocation of a bed to a patient
  allocateBed: async ({ bedId, patientId }) => {
    const response = await api.post('/beds/allocate', { bedId, patientId });
    return response.data;
  },

  // PATCH /api/beds/:id/release - Admin releases an occupied bed
  releaseBed: async (bedId) => {
    const response = await api.patch(`/beds/${bedId}/release`);
    return response.data;
  },
};

export default roomService;
