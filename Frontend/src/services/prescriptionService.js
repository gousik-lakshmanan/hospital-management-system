import api from './api';

export const prescriptionService = {
  // POST /api/prescriptions - Create a new prescription (Doctor / Admin)
  createPrescription: async (prescriptionData) => {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },

  // GET /api/prescriptions/my - Patient views own personal prescriptions
  getMyPrescriptions: async () => {
    const response = await api.get('/prescriptions/my');
    return response.data;
  },

  // GET /api/prescriptions/my-created - Doctor views prescriptions created by them
  getMyCreatedPrescriptions: async () => {
    const response = await api.get('/prescriptions/my-created');
    return response.data;
  },

  // GET /api/prescriptions - Admin & Pharmacist view all prescriptions
  getAllPrescriptions: async (params = {}) => {
    const response = await api.get('/prescriptions', { params });
    return response.data;
  },

  // GET /api/prescriptions/patient/:patientId - View specific patient prescriptions
  getPatientPrescriptions: async (patientId) => {
    const response = await api.get(`/prescriptions/patient/${patientId}`);
    return response.data;
  },

  // PATCH /api/prescriptions/:id/dispense - Admin / Pharmacist dispenses prescription
  dispensePrescription: async (id) => {
    const response = await api.patch(`/prescriptions/${id}/dispense`);
    return response.data;
  },

  // PATCH /api/prescriptions/:id/cancel - Doctor / Admin cancels pending prescription
  cancelPrescription: async (id) => {
    const response = await api.patch(`/prescriptions/${id}/cancel`);
    return response.data;
  },
};

export default prescriptionService;
