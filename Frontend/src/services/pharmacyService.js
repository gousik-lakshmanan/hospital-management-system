import api from './api';

export const pharmacyService = {
  // GET /api/pharmacy/medicines - List active medicines with optional search/filters
  getMedicines: async (params = {}) => {
    const response = await api.get('/pharmacy/medicines', { params });
    return response.data;
  },

  // GET /api/pharmacy/medicines/:id - Get single formulation detail
  getMedicine: async (id) => {
    const response = await api.get(`/pharmacy/medicines/${id}`);
    return response.data;
  },

  // POST /api/pharmacy/medicines - Register formulation (Admin / Pharmacist)
  createMedicine: async (medicineData) => {
    const response = await api.post('/pharmacy/medicines', medicineData);
    return response.data;
  },

  // PUT /api/pharmacy/medicines/:id - Update formulation (Admin / Pharmacist)
  updateMedicine: async (id, medicineData) => {
    const response = await api.put(`/pharmacy/medicines/${id}`, medicineData);
    return response.data;
  },

  // PATCH /api/pharmacy/medicines/:id/deactivate - Soft deactivate formulation
  deactivateMedicine: async (id) => {
    const response = await api.patch(`/pharmacy/medicines/${id}/deactivate`);
    return response.data;
  },

  // PATCH /api/pharmacy/medicines/:id/stock - Atomic stock adjustment
  adjustStock: async (id, change) => {
    const response = await api.patch(`/pharmacy/medicines/${id}/stock`, { change });
    return response.data;
  },
};

export default pharmacyService;
