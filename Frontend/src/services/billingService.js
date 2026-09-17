import api from './api';

export const billingService = {
  getBills: async (params = {}) => {
    const response = await api.get('/billing', { params });
    return response.data;
  },

  getMyBills: async () => {
    const response = await api.get('/billing/my');
    return response.data;
  },

  getBillingSummary: async () => {
    const response = await api.get('/billing/summary');
    return response.data;
  },

  getBillById: async (id) => {
    const response = await api.get(`/billing/${id}`);
    return response.data;
  },

  getBillsByPatientId: async (patientId) => {
    const response = await api.get(`/billing/patient/${patientId}`);
    return response.data;
  },

  createBill: async (billData) => {
    const response = await api.post('/billing', billData);
    return response.data;
  },

  recordPayment: async (id, paymentData) => {
    const response = await api.patch(`/billing/${id}/payment`, paymentData);
    return response.data;
  },

  cancelBill: async (id) => {
    const response = await api.patch(`/billing/${id}/cancel`);
    return response.data;
  }
};

export default billingService;
