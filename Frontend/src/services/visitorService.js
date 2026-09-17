import api from './api';

export const visitorService = {
  getVisitors: async (params = {}) => {
    const response = await api.get('/visitors', { params });
    return response.data;
  },

  getVisitorById: async (id) => {
    const response = await api.get(`/visitors/${id}`);
    return response.data;
  },

  getVisitorsByPatientId: async (patientId) => {
    const response = await api.get(`/visitors/patient/${patientId}`);
    return response.data;
  },

  createVisitor: async (visitorData) => {
    const response = await api.post('/visitors', visitorData);
    return response.data;
  },

  checkInVisitor: async (id) => {
    const response = await api.patch(`/visitors/${id}/check-in`);
    return response.data;
  },

  checkOutVisitor: async (id) => {
    const response = await api.patch(`/visitors/${id}/check-out`);
    return response.data;
  },

  cancelVisitor: async (id) => {
    const response = await api.patch(`/visitors/${id}/cancel`);
    return response.data;
  },

  updateVisitor: async (id, updateData) => {
    const response = await api.patch(`/visitors/${id}`, updateData);
    return response.data;
  }
};

export default visitorService;
