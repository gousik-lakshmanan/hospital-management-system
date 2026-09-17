import api from './api';

export const bloodBankService = {
  // 1. Stock Endpoints
  getBloodStock: async () => {
    const response = await api.get('/blood-bank/stock');
    return response.data;
  },

  getBloodStockByGroup: async (bloodGroup) => {
    const response = await api.get(`/blood-bank/stock/${encodeURIComponent(bloodGroup)}`);
    return response.data;
  },

  updateBloodStock: async (bloodGroup, payload) => {
    const response = await api.patch(`/blood-bank/stock/${encodeURIComponent(bloodGroup)}`, payload);
    return response.data;
  },

  // 2. Donor Endpoints
  getDonors: async (params = {}) => {
    const response = await api.get('/blood-bank/donors', { params });
    return response.data;
  },

  registerDonor: async (donorData) => {
    const response = await api.post('/blood-bank/donors', donorData);
    return response.data;
  },

  updateDonor: async (id, donorData) => {
    const response = await api.patch(`/blood-bank/donors/${id}`, donorData);
    return response.data;
  },

  // 3. Blood Request Workflow Endpoints
  createBloodRequest: async (bloodGroup, requestedUnits) => {
    const response = await api.post('/blood-requests', {
      bloodGroup,
      requestedUnits: parseInt(requestedUnits, 10),
    });
    return response.data;
  },

  getMyBloodRequests: async () => {
    const response = await api.get('/blood-requests/my');
    return response.data;
  },

  getAllBloodRequests: async (params = {}) => {
    const response = await api.get('/blood-requests', { params });
    return response.data;
  },

  getBloodRequestById: async (id) => {
    const response = await api.get(`/blood-requests/${id}`);
    return response.data;
  },

  approveBloodRequest: async (id) => {
    const response = await api.patch(`/blood-requests/${id}/approve`);
    return response.data;
  },

  negotiateBloodRequest: async (id, approvedUnits) => {
    const response = await api.patch(`/blood-requests/${id}/negotiate`, {
      approvedUnits: parseInt(approvedUnits, 10),
    });
    return response.data;
  },

  rejectBloodRequest: async (id) => {
    const response = await api.patch(`/blood-requests/${id}/reject`);
    return response.data;
  },
};

export default bloodBankService;
