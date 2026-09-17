import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext } from './NotificationContext';
import bloodBankService from '../services/bloodBankService';

export const BloodBankContext = createContext();

export const BloodBankProvider = ({ children }) => {
  const { currentRole, user, isAuthenticated } = useAuth();
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx?.addNotification || (() => {});

  const [stock, setStock] = useState([]);
  const [donors, setDonors] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [myBloodRequests, setMyBloodRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clean up any legacy localStorage keys if present
  useEffect(() => {
    try {
      localStorage.removeItem('medisync_blood_stock');
      localStorage.removeItem('medisync_blood_donors');
      localStorage.removeItem('medisync_blood_requests');
    } catch (e) {
      // Ignore
    }
  }, []);

  // Fetch Blood Stock (All authenticated roles)
  const refreshStock = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await bloodBankService.getBloodStock();
      if (res.success && Array.isArray(res.data)) {
        setStock(res.data);
      }
    } catch (err) {
      console.warn('Failed to load blood stock:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to load blood stock.');
    }
  }, [isAuthenticated]);

  // Fetch Donors (Admin, Doctor, Nurse, Receptionist only; Patient and Pharmacist blocked)
  const refreshDonors = useCallback(async () => {
    if (!isAuthenticated || currentRole === 'patient' || currentRole === 'pharmacist') {
      setDonors([]);
      return;
    }
    try {
      const res = await bloodBankService.getDonors();
      if (res.success && Array.isArray(res.data)) {
        setDonors(res.data);
      }
    } catch (err) {
      console.warn('Failed to load donors list:', err.response?.data?.message || err.message);
    }
  }, [isAuthenticated, currentRole]);

  // Fetch Requests (Admin loads all requests; Non-admin loads my requests)
  const refreshRequests = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      if (currentRole === 'admin') {
        const res = await bloodBankService.getAllBloodRequests();
        if (res.success && Array.isArray(res.data)) {
          setBloodRequests(res.data);
        }
      } else {
        const res = await bloodBankService.getMyBloodRequests();
        if (res.success && Array.isArray(res.data)) {
          setMyBloodRequests(res.data);
          setBloodRequests(res.data); // Shared alias for uniform table access
        }
      }
    } catch (err) {
      console.warn('Failed to load blood requests:', err.response?.data?.message || err.message);
    }
  }, [isAuthenticated, currentRole]);

  // Load initial data on mount and role/auth changes
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([refreshStock(), refreshDonors(), refreshRequests()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isAuthenticated, currentRole, refreshStock, refreshDonors, refreshRequests]);

  // Admin updates bag count for a blood group
  const updateBagCount = async (group, newCount) => {
    if (currentRole !== 'admin') {
      console.warn('Action-level authorization error: Only administrators can modify blood stock counts.');
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const validCount = Math.max(0, parseInt(newCount, 10) || 0);
      const res = await bloodBankService.updateBloodStock(group, { units: validCount });
      if (res.success) {
        await refreshStock();
        addNotification(
          'Blood Stock Updated',
          `Inventory for blood group ${group} adjusted to ${validCount} bags.`,
          'System'
        );
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update stock count.';
      return { success: false, error: errMsg };
    }
  };

  // Admin registers a new donor
  const addDonor = async (donorData) => {
    if (currentRole !== 'admin') {
      console.warn('Action-level authorization error: Only administrators can register blood donors.');
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const res = await bloodBankService.registerDonor({
        name: donorData.name,
        age: donorData.age || 25,
        gender: donorData.gender || 'Other',
        bloodGroup: donorData.bloodGroup,
        phone: donorData.phone,
        email: donorData.email || '',
        address: donorData.address || '',
        lastDonationDate: donorData.lastDonated || new Date(),
      });

      if (res.success) {
        await Promise.all([refreshDonors(), refreshStock()]);
        addNotification(
          'Blood Donor Registered',
          `Donor ${donorData.name} (${donorData.bloodGroup}) registered into hospital log.`,
          'Success'
        );
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to register blood donor.';
      return { success: false, error: errMsg };
    }
  };

  // Requester (Doctor, Nurse, Receptionist, Patient) creates a blood request
  const createBloodRequest = async (bloodGroup, requestedUnits) => {
    if (currentRole === 'admin') {
      console.warn('Action not applicable for administrators.');
      return { success: false, error: 'Administrators manage requests rather than creating them.' };
    }

    try {
      const res = await bloodBankService.createBloodRequest(bloodGroup, requestedUnits);
      if (res.success) {
        await Promise.all([refreshRequests(), refreshStock()]);
        addNotification(
          'Blood Request Submitted',
          `Your request for ${requestedUnits} units of ${bloodGroup} was dispatched for administrator review.`,
          'Info'
        );
        return { success: true, request: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to create blood request.';
      const currentAvailable = err.response?.data?.availableUnits;
      return { success: false, error: errMsg, currentAvailable };
    }
  };

  // Admin approves a pending blood request
  const approveBloodRequest = async (requestId) => {
    if (currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can approve blood requests.' };
    }

    try {
      const res = await bloodBankService.approveBloodRequest(requestId);
      if (res.success) {
        await Promise.all([refreshRequests(), refreshStock()]);
        addNotification(
          'Blood Request Approved',
          res.message || 'Blood request approved successfully.',
          'Success'
        );
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to approve blood request.';
      return { success: false, error: errMsg };
    }
  };

  // Admin negotiates a pending blood request with custom approved quantity
  const negotiateBloodRequest = async (requestId, approvedUnits) => {
    if (currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can negotiate blood requests.' };
    }

    try {
      const res = await bloodBankService.negotiateBloodRequest(requestId, approvedUnits);
      if (res.success) {
        await Promise.all([refreshRequests(), refreshStock()]);
        addNotification(
          'Blood Request Negotiated',
          res.message || `Blood request negotiated: ${approvedUnits} units approved.`,
          'Info'
        );
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to negotiate blood request.';
      return { success: false, error: errMsg };
    }
  };

  // Admin rejects a pending blood request
  const rejectBloodRequest = async (requestId) => {
    if (currentRole !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can reject blood requests.' };
    }

    try {
      const res = await bloodBankService.rejectBloodRequest(requestId);
      if (res.success) {
        await refreshRequests();
        addNotification(
          'Blood Request Rejected',
          res.message || 'Blood request rejected.',
          'Warning'
        );
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to reject blood request.';
      return { success: false, error: errMsg };
    }
  };

  return (
    <BloodBankContext.Provider
      value={{
        stock,
        donors,
        bloodRequests,
        myBloodRequests,
        loading,
        error,
        refreshStock,
        refreshDonors,
        refreshRequests,
        updateBagCount,
        addDonor,
        createBloodRequest,
        approveBloodRequest,
        negotiateBloodRequest,
        rejectBloodRequest,
      }}
    >
      {children}
    </BloodBankContext.Provider>
  );
};

export const useBloodBank = () => {
  const context = useContext(BloodBankContext);
  if (!context) {
    throw new Error('useBloodBank must be used within a BloodBankProvider');
  }
  return context;
};

export default BloodBankContext;
