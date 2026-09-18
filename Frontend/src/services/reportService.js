import api from './api';

export const reportService = {
  getSummary: async (params = {}) => {
    const response = await api.get('/reports/summary', { params });
    return response.data;
  },

  getAppointments: async (params = {}) => {
    const response = await api.get('/reports/appointments', { params });
    return response.data;
  },

  getBedOccupancy: async () => {
    const response = await api.get('/reports/bed-occupancy');
    return response.data;
  },

  getPharmacyInventory: async () => {
    const response = await api.get('/reports/pharmacy-inventory');
    return response.data;
  },

  getBloodBank: async () => {
    const response = await api.get('/reports/blood-bank');
    return response.data;
  },

  getFinancial: async (params = {}) => {
    const response = await api.get('/reports/financial', { params });
    return response.data;
  },

  getDietCompliance: async () => {
    const response = await api.get('/reports/diet-compliance');
    return response.data;
  },

  getVisitors: async (params = {}) => {
    const response = await api.get('/reports/visitors', { params });
    return response.data;
  }
};

export default reportService;
