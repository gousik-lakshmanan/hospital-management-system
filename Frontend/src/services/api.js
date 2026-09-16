import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medisync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired or invalid credentials
      const token = localStorage.getItem('medisync_token');
      if (token) {
        localStorage.removeItem('medisync_token');
        localStorage.removeItem('medisync_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service Endpoints
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Patient Service Endpoints (MongoDB Atlas Persistent)
export const patientService = {
  getMyProfile: async () => {
    const response = await api.get('/patients/me');
    return response.data;
  },

  getPatients: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  getPatientById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  updateVitals: async (id, vitalsData) => {
    const response = await api.put(`/patients/${id}/vitals`, vitalsData);
    return response.data;
  },

  createPatient: async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },
};

// Appointment Service Endpoints (MongoDB Atlas Persistent)
export const appointmentService = {
  getProviders: async () => {
    const response = await api.get('/appointments/providers');
    return response.data;
  },

  book: async (apptData) => {
    const response = await api.post('/appointments', apptData);
    return response.data;
  },

  getMyAppointments: async () => {
    const response = await api.get('/appointments/my');
    return response.data;
  },

  getDoctorAppointments: async () => {
    const response = await api.get('/appointments/doctor');
    return response.data;
  },

  getNurseAppointments: async () => {
    const response = await api.get('/appointments/nurse');
    return response.data;
  },

  getAllAppointments: async () => {
    const response = await api.get('/appointments');
    return response.data;
  },

  updateStatus: async (id, status, notes = '') => {
    const response = await api.patch(`/appointments/${id}/status`, { status, notes });
    return response.data;
  },

  reschedule: async (id, date, time, notes = '') => {
    const response = await api.patch(`/appointments/${id}/reschedule`, { date, time, notes });
    return response.data;
  },
};

// Profile Service Endpoints (MongoDB Atlas Persistent)
export const profileService = {
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/profile/me', profileData);
    return response.data;
  },

  updateProfilePicture: async (profilePicture) => {
    const response = await api.put('/profile/me/picture', { profilePicture });
    return response.data;
  },
};

// User / Practitioner Management Endpoints (Admin Authorized)
export const userService = {
  createDoctor: async (doctorData) => {
    const response = await api.post('/users/doctors', doctorData);
    return response.data;
  },

  createNurse: async (nurseData) => {
    const response = await api.post('/users/nurses', nurseData);
    return response.data;
  },

  getDoctors: async () => {
    const response = await api.get('/users/doctors');
    return response.data;
  },

  getNurses: async () => {
    const response = await api.get('/users/nurses');
    return response.data;
  },
};

export default api;
