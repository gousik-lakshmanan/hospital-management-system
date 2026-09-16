import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { prescriptionService } from '../services/prescriptionService';
import { NotificationContext } from './NotificationContext';
import { useAuth } from '../hooks/useAuth';

export const PrescriptionContext = createContext();

export const PrescriptionProvider = ({ children }) => {
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx ? notifCtx.addNotification : null;
  const { currentRole, user } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrescriptions = useCallback(async (params = {}) => {
    if (!user) return;
    try {
      setLoading(true);
      let res;
      if (currentRole === 'patient') {
        res = await prescriptionService.getMyPrescriptions();
      } else if (currentRole === 'doctor') {
        res = await prescriptionService.getMyCreatedPrescriptions();
      } else {
        res = await prescriptionService.getAllPrescriptions(params);
      }

      if (res && res.success && Array.isArray(res.data)) {
        setPrescriptions(res.data);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [currentRole, user]);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user, fetchPrescriptions]);

  const createPrescription = async (prescriptionData) => {
    try {
      const res = await prescriptionService.createPrescription(prescriptionData);
      if (res.success) {
        await fetchPrescriptions();
        if (addNotification) {
          addNotification('Prescription Issued', `Prescription created for ${res.data.patientName}.`, 'System');
        }
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Failed to create prescription' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create prescription';
      return { success: false, message: msg };
    }
  };

  const dispensePrescription = async (id) => {
    try {
      const res = await prescriptionService.dispensePrescription(id);
      if (res.success) {
        await fetchPrescriptions();
        if (addNotification) {
          addNotification('Prescription Dispensed', res.message || 'Medication dispensed successfully.', 'System');
        }
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Dispensing failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to dispense prescription';
      return { success: false, message: msg };
    }
  };

  const cancelPrescription = async (id) => {
    try {
      const res = await prescriptionService.cancelPrescription(id);
      if (res.success) {
        await fetchPrescriptions();
        if (addNotification) {
          addNotification('Prescription Cancelled', 'Prescription has been cancelled.', 'System');
        }
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Cancellation failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel prescription';
      return { success: false, message: msg };
    }
  };

  return (
    <PrescriptionContext.Provider
      value={{
        prescriptions,
        loading,
        error,
        fetchPrescriptions,
        createPrescription,
        dispensePrescription,
        cancelPrescription,
      }}
    >
      {children}
    </PrescriptionContext.Provider>
  );
};

export const usePrescriptions = () => {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error('usePrescriptions must be used within a PrescriptionProvider');
  }
  return context;
};

export default PrescriptionContext;
