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
      id: `N-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: String(title),
      description: String(description),
      time: 'Just now',
      type: String(type),
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
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
