import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext } from './NotificationContext';
import visitorService from '../services/visitorService';

export const VisitorContext = createContext();

export const VisitorProvider = ({ children }) => {
  const { currentRole, isAuthenticated } = useAuth();
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx?.addNotification || (() => {});

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshVisitors = useCallback(async (params = {}) => {
    if (!isAuthenticated || currentRole === 'pharmacist') {
      setVisitors([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await visitorService.getVisitors(params);
      if (res.success && Array.isArray(res.data)) {
        setVisitors(res.data);
      }
    } catch (err) {
      console.warn('Failed to load visitors:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to fetch visitor records.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentRole]);

  useEffect(() => {
    refreshVisitors();
  }, [refreshVisitors]);

  const createVisitor = async (visitorData) => {
    try {
      setLoading(true);
      const res = await visitorService.createVisitor(visitorData);
      if (res.success) {
        addNotification(
          'Visitor Pass Created',
          `Visitor pass ${res.data?.passId || ''} created successfully.`,
          'success'
        );
        await refreshVisitors();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create visitor pass.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkInVisitor = async (id) => {
    try {
      setLoading(true);
      const res = await visitorService.checkInVisitor(id);
      if (res.success) {
        addNotification(
          'Visitor Checked In',
          `Visitor pass ${res.data?.passId || ''} checked in.`,
          'success'
        );
        await refreshVisitors();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to check in visitor.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkOutVisitor = async (id) => {
    try {
      setLoading(true);
      const res = await visitorService.checkOutVisitor(id);
      if (res.success) {
        addNotification(
          'Visitor Checked Out',
          `Visitor pass ${res.data?.passId || ''} checked out.`,
          'success'
        );
        await refreshVisitors();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to check out visitor.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelVisitor = async (id) => {
    try {
      setLoading(true);
      const res = await visitorService.cancelVisitor(id);
      if (res.success) {
        addNotification(
          'Visitor Pass Cancelled',
          `Visitor pass ${res.data?.passId || ''} cancelled.`,
          'info'
        );
        await refreshVisitors();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel visitor pass.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVisitor = async (id, updateData) => {
    try {
      setLoading(true);
      const res = await visitorService.updateVisitor(id, updateData);
      if (res.success) {
        addNotification(
          'Visitor Pass Updated',
          `Visitor pass ${res.data?.passId || ''} updated successfully.`,
          'success'
        );
        await refreshVisitors();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update visitor pass.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisitorContext.Provider
      value={{
        visitors,
        loading,
        error,
        refreshVisitors,
        createVisitor,
        checkInVisitor,
        checkOutVisitor,
        cancelVisitor,
        updateVisitor
      }}
    >
      {children}
    </VisitorContext.Provider>
  );
};

export const useVisitors = () => {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitors must be used within a VisitorProvider');
  }
  return context;
};

export default VisitorContext;
