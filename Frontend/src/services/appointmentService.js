import api from './api';

export const appointmentService = {
  /**
   * Get active healthcare providers (doctors & nurses)
   */
  getProviders: async () => {
    const response = await api.get('/appointments/providers');
    return response.data;
  },

  /**
   * Book a new doctor or nurse appointment
   */
  book: async (apptData) => {
    const response = await api.post('/appointments', apptData);
    return response.data;
  },

  /**
   * Get appointments for the authenticated patient
   */
  getMyAppointments: async (status = '') => {
    const url = status ? `/appointments/my?status=${encodeURIComponent(status)}` : '/appointments/my';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get appointments assigned to the authenticated doctor
   */
  getDoctorAppointments: async (status = '') => {
    const url = status ? `/appointments/doctor?status=${encodeURIComponent(status)}` : '/appointments/doctor';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get appointments assigned to the authenticated nurse
   */
  getNurseAppointments: async (status = '') => {
    const url = status ? `/appointments/nurse?status=${encodeURIComponent(status)}` : '/appointments/nurse';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get all hospital appointments (Admin & Receptionist)
   */
  getAllAppointments: async (status = '', type = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    const qs = params.toString();
    const url = qs ? `/appointments?${qs}` : '/appointments';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Update appointment status (Accept, Reject, Conclude, or Patient Cancel)
   */
  updateStatus: async (id, status, notes = '') => {
    const response = await api.patch(`/appointments/${id}/status`, { status, notes });
    return response.data;
  },

  /**
   * Reschedule appointment to a new date and time
   */
  reschedule: async (id, date, time, notes = '') => {
    const response = await api.patch(`/appointments/${id}/reschedule`, { date, time, notes });
    return response.data;
  },
};

export default appointmentService;
