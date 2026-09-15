import React, { createContext, useState, useEffect } from 'react';
import { mockNotifications } from '../data/mockData';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [toast, setToast] = useState(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const addNotification = (title, description, type = 'System') => {
    const newNotif = {
      id: `N-${Date.now()}`,
      title,
      description,
      time: 'Just now',
      type,
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
    showToast(title, description, type);
  };

  const showToast = (title, description, type = 'info') => {
    setToast({ title, description, type });
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
      toast,
      markAllAsRead,
      markAsRead,
      addNotification,
      showToast,
      clearToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
