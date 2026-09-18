import api from './api';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(/notifications//read);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(/notifications/);
    return response.data;
  }
};

export default notificationService;
