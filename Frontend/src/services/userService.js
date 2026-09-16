import api from './api';

export const userService = {
  /**
   * Admin creates a new Doctor account
   */
  createDoctor: async (doctorData) => {
    const response = await api.post('/users/doctors', doctorData);
    return response.data;
  },

  /**
   * Admin creates a new Nurse account
   */
  createNurse: async (nurseData) => {
    const response = await api.post('/users/nurses', nurseData);
    return response.data;
  },

  /**
   * Get active Doctors list
   */
  getDoctors: async () => {
    const response = await api.get('/users/doctors');
    return response.data;
  },

  /**
   * Get active Nurses list
   */
  getNurses: async () => {
    const response = await api.get('/users/nurses');
    return response.data;
  },
};

export default userService;
