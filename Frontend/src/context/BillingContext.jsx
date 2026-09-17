import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext } from './NotificationContext';
import billingService from '../services/billingService';

export const BillingContext = createContext();

export const BillingProvider = ({ children }) => {
  const { currentRole, isAuthenticated } = useAuth();
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx?.addNotification || (() => {});

  const [bills, setBills] = useState([]);
  const [myBills, setMyBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshBills = useCallback(async (params = {}) => {
    if (!isAuthenticated || currentRole === 'pharmacist') {
      setBills([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await billingService.getBills(params);
      if (res.success && Array.isArray(res.data)) {
        setBills(res.data);
      }
    } catch (err) {
      console.warn('Failed to load bills:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to fetch billing invoices.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentRole]);

  const refreshMyBills = useCallback(async () => {
    if (!isAuthenticated || currentRole !== 'patient') {
      setMyBills([]);
      return;
    }
    try {
      const res = await billingService.getMyBills();
      if (res.success && Array.isArray(res.data)) {
        setMyBills(res.data);
      }
    } catch (err) {
      console.warn('Failed to load my bills:', err.response?.data?.message || err.message);
    }
  }, [isAuthenticated, currentRole]);

  const refreshSummary = useCallback(async () => {
    if (!isAuthenticated || (currentRole !== 'admin' && currentRole !== 'receptionist')) {
      setSummary(null);
      return;
    }
    try {
      const res = await billingService.getBillingSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.warn('Failed to load billing summary:', err.response?.data?.message || err.message);
    }
  }, [isAuthenticated, currentRole]);

  useEffect(() => {
    if (currentRole === 'patient') {
      refreshMyBills();
    } else {
      refreshBills();
      if (currentRole === 'admin' || currentRole === 'receptionist') {
        refreshSummary();
      }
    }
  }, [currentRole, refreshBills, refreshMyBills, refreshSummary]);

  const createBill = async (billData) => {
    try {
      setLoading(true);
      const res = await billingService.createBill(billData);
      if (res.success) {
        addNotification(
          'Invoice Created',
          `Invoice ${res.data?.invoiceNumber || ''} created successfully.`,
          'success'
        );
        await refreshBills();
        await refreshSummary();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create invoice.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (id, paymentData) => {
    try {
      setLoading(true);
      const res = await billingService.recordPayment(id, paymentData);
      if (res.success) {
        addNotification(
          'Payment Recorded',
          res.message || 'Payment recorded successfully.',
          'success'
        );
        await refreshBills();
        await refreshSummary();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to record payment.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelBill = async (id) => {
    try {
      setLoading(true);
      const res = await billingService.cancelBill(id);
      if (res.success) {
        addNotification(
          'Invoice Cancelled',
          'Invoice cancelled successfully.',
          'info'
        );
        await refreshBills();
        await refreshSummary();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel invoice.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <BillingContext.Provider
      value={{
        bills,
        myBills,
        summary,
        loading,
        error,
        refreshBills,
        refreshMyBills,
        refreshSummary,
        createBill,
        recordPayment,
        cancelBill
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

export default BillingContext;
