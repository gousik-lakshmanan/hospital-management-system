import React, { createContext, useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

export const NotificationContext = createContext();

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'Recently';
  }
};

const normalizeNotification = (n) => ({
  ...n,
  id: n._id || n.id,
  description: n.message || n.description || '',
  unread: n.isRead !== undefined ? !n.isRead : Boolean(n.unread),
  time: n.createdAt ? formatTimeAgo(n.createdAt) : (n.time || 'Just now'),
  type: n.type || 'system',
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('medisync_token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 50 });
      if (res && res.success && Array.isArray(res.data)) {
        const normalized = res.data.map(normalizeNotification);
        setNotifications(normalized);
        setUnreadCount(res.unreadCount !== undefined ? res.unreadCount : normalized.filter(n => n.unread).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications from backend:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, unread: false, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read on backend:', err?.message);
      fetchNotifications();
    }
  };

  const markAsRead = async (id) => {
    if (!id) return;
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id || n._id === id ? { ...n, unread: false, isRead: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err?.message);
    }
  };

  const deleteNotification = async (id) => {
    if (!id) return;
    setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
    try {
      await notificationService.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err?.message);
    }
  };

  const addNotification = (titleOrObj, maybeDescription, maybeType = 'System') => {
    let title = 'Notification';
    let description = '';
    let type = 'System';

    if (typeof titleOrObj === 'object' && titleOrObj !== null) {
      title = titleOrObj.title || (titleOrObj.type === 'error' || titleOrObj.type === 'danger' ? 'Error' : titleOrObj.type === 'success' ? 'Success' : 'Notice');
      description = titleOrObj.description || titleOrObj.message || '';
      type = titleOrObj.type || 'System';
    } else {
      title = typeof titleOrObj === 'string' ? titleOrObj : String(titleOrObj || 'Notification');
      description = typeof maybeDescription === 'string' ? maybeDescription : (maybeDescription?.message || maybeDescription?.description || String(maybeDescription || ''));
      type = typeof maybeType === 'string' ? maybeType : 'System';
    }

    const newNotif = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: String(title),
      description: String(description),
      time: 'Just now',
      type: String(type),
      unread: true,
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
    showToast(newNotif.title, newNotif.description, newNotif.type);
  };

  const showToast = (titleOrObj, maybeDescription, maybeType = 'info') => {
    let title = 'Notice';
    let description = '';
    let type = 'info';

    if (typeof titleOrObj === 'object' && titleOrObj !== null) {
      title = titleOrObj.title || (titleOrObj.type === 'error' || titleOrObj.type === 'danger' ? 'Error' : titleOrObj.type === 'success' ? 'Success' : 'Notice');
      description = titleOrObj.description || titleOrObj.message || '';
      type = titleOrObj.type || 'info';
    } else {
      title = typeof titleOrObj === 'string' ? titleOrObj : String(titleOrObj || 'Notice');
      description = typeof maybeDescription === 'string' ? maybeDescription : String(maybeDescription || '');
      type = typeof maybeType === 'string' ? maybeType : 'info';
    }

    setToast({ title: String(title), description: String(description), type: String(type) });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const clearToast = () => {
    setToast(null);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      toast,
      fetchNotifications,
      markAllAsRead,
      markAsRead,
      deleteNotification,
      addNotification,
      showToast,
      clearToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
