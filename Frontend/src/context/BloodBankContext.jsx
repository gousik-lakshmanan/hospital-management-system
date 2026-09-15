import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockBloodStock, mockBloodDonors } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

export const BloodBankContext = createContext();

const calculateStatus = (bags) => {
  if (bags <= 2) return 'Emergency Alert';
  if (bags <= 5) return 'Low Stock';
  return 'Normal';
};

export const BloodBankProvider = ({ children }) => {
  const { currentRole, user } = useAuth();

  const [stock, setStock] = useState(() => {
    try {
      const saved = localStorage.getItem('medisync_blood_stock');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load blood stock from localStorage', e);
    }
    return mockBloodStock;
  });

  const [donors, setDonors] = useState(() => {
    try {
      const saved = localStorage.getItem('medisync_blood_donors');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load blood donors from localStorage', e);
    }
    return mockBloodDonors;
  });

  const [bloodRequests, setBloodRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('medisync_blood_requests');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load blood requests from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('medisync_blood_stock', JSON.stringify(stock));
    } catch (e) {
      console.error('Failed to save blood stock to localStorage', e);
    }
  }, [stock]);

  useEffect(() => {
    try {
      localStorage.setItem('medisync_blood_donors', JSON.stringify(donors));
    } catch (e) {
      console.error('Failed to save blood donors to localStorage', e);
    }
  }, [donors]);

  useEffect(() => {
    try {
      localStorage.setItem('medisync_blood_requests', JSON.stringify(bloodRequests));
    } catch (e) {
      console.error('Failed to save blood requests to localStorage', e);
    }
  }, [bloodRequests]);

  // Admin updates bag count for a blood group (Frontend Action-Level Guard)
  const updateBagCount = (group, newCount) => {
    if (currentRole !== 'admin') {
      console.warn('Frontend action-level authorization error: Only administrators can modify blood stock counts.');
      return false;
    }

    const validCount = Math.max(0, parseInt(newCount, 10) || 0);
    setStock((prevStock) =>
      prevStock.map((item) => {
        if (item.group === group) {
          return {
            ...item,
            bags: validCount,
            status: calculateStatus(validCount)
          };
        }
        return item;
      })
    );
    return true;
  };

  // Register a new donor (Frontend Action-Level Guard)
  const addDonor = (donorData) => {
    if (currentRole !== 'admin') {
      console.warn('Frontend action-level authorization error: Only administrators can register blood donors.');
      return null;
    }

    const newId = `BD-${String(donors.length + 1).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const newDonor = {
      id: newId,
      name: donorData.name,
      bloodGroup: donorData.bloodGroup,
      phone: donorData.phone,
      lastDonated: today
    };

    setDonors((prev) => [newDonor, ...prev]);

    // Also increment corresponding stock count
    setStock((prevStock) =>
      prevStock.map((item) => {
        if (item.group === donorData.bloodGroup) {
          const newBags = item.bags + 1;
          return {
            ...item,
            bags: newBags,
            status: calculateStatus(newBags)
          };
        }
        return item;
      })
    );

    return newDonor;
  };

  // Requester (Doctor, Nurse, Receptionist, Patient) creates a blood request
  const createBloodRequest = (bloodGroup, requestedUnits) => {
    if (currentRole === 'admin') {
      console.warn('Action not applicable for administrators.');
      return { success: false, error: 'Administrators manage requests rather than creating them.' };
    }

    const parsedUnits = parseInt(requestedUnits, 10);
    if (!parsedUnits || parsedUnits < 1) {
      return { success: false, error: 'Requested units must be at least 1.' };
    }

    // Live stock verification at submission time
    const targetGroupStock = stock.find((s) => s.group === bloodGroup);
    const availableUnits = targetGroupStock ? targetGroupStock.bags : 0;

    if (availableUnits <= 0) {
      return {
        success: false,
        error: `Currently unavailable. No units are available for blood group ${bloodGroup}.`,
        currentAvailable: 0
      };
    }

    if (parsedUnits > availableUnits) {
      return {
        success: false,
        error: `Blood stock has changed. Only ${availableUnits} units of ${bloodGroup} are currently available.`,
        currentAvailable: availableUnits
      };
    }

    const now = new Date().toISOString();
    const newRequest = {
      id: `REQ-${Date.now()}`,
      requesterId: user?.id || `USER-${Date.now()}`,
      requesterName: user?.name || 'Staff User',
      requesterRole: user?.role || currentRole,
      bloodGroup,
      requestedUnits: parsedUnits,
      approvedUnits: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // Stock is NOT deducted upon request creation
    setBloodRequests((prev) => [newRequest, ...prev]);
    return { success: true, request: newRequest };
  };

  // Admin approves a pending blood request
  const approveBloodRequest = (requestId) => {
    if (currentRole !== 'admin') {
      console.warn('Frontend action-level authorization error: Only administrators can approve blood requests.');
      return { success: false, error: 'Unauthorized: Only administrators can approve blood requests.' };
    }

    const targetRequest = bloodRequests.find((r) => r.id === requestId);
    if (!targetRequest) {
      return { success: false, error: 'Blood request not found.' };
    }

    if (targetRequest.status !== 'pending') {
      return { success: false, error: `Request cannot be approved because its current status is '${targetRequest.status}'.` };
    }

    // Re-check live stock before modifying
    const targetGroupStock = stock.find((s) => s.group === targetRequest.bloodGroup);
    const availableUnits = targetGroupStock ? targetGroupStock.bags : 0;

    if (availableUnits < targetRequest.requestedUnits) {
      return {
        success: false,
        error: `Insufficient blood stock. Only ${availableUnits} units of ${targetRequest.bloodGroup} are currently available.`,
        currentAvailable: availableUnits
      };
    }

    // Deduct stock strictly
    const newStockCount = availableUnits - targetRequest.requestedUnits;
    setStock((prevStock) =>
      prevStock.map((item) => {
        if (item.group === targetRequest.bloodGroup) {
          return {
            ...item,
            bags: newStockCount,
            status: calculateStatus(newStockCount)
          };
        }
        return item;
      })
    );

    const now = new Date().toISOString();
    setBloodRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              approvedUnits: targetRequest.requestedUnits,
              updatedAt: now
            }
          : r
      )
    );

    return { success: true };
  };

  // Admin negotiates a pending blood request with custom approved quantity
  const negotiateBloodRequest = (requestId, approvedUnits) => {
    if (currentRole !== 'admin') {
      console.warn('Frontend action-level authorization error: Only administrators can negotiate blood requests.');
      return { success: false, error: 'Unauthorized: Only administrators can negotiate blood requests.' };
    }

    const targetRequest = bloodRequests.find((r) => r.id === requestId);
    if (!targetRequest) {
      return { success: false, error: 'Blood request not found.' };
    }

    if (targetRequest.status !== 'pending') {
      return { success: false, error: `Request cannot be negotiated because its current status is '${targetRequest.status}'.` };
    }

    const parsedApproved = parseInt(approvedUnits, 10);
    const targetGroupStock = stock.find((s) => s.group === targetRequest.bloodGroup);
    const availableUnits = targetGroupStock ? targetGroupStock.bags : 0;

    if (availableUnits <= 0) {
      return {
        success: false,
        error: `No units of ${targetRequest.bloodGroup} are currently available to negotiate.`,
        currentAvailable: 0
      };
    }

    const maxAllowed = Math.min(targetRequest.requestedUnits, availableUnits);
    if (!parsedApproved || parsedApproved < 1 || parsedApproved > maxAllowed) {
      return {
        success: false,
        error: `Approved quantity must be between 1 and ${maxAllowed}.`,
        currentAvailable: availableUnits
      };
    }

    // Deduct negotiated quantity from stock
    const newStockCount = availableUnits - parsedApproved;
    setStock((prevStock) =>
      prevStock.map((item) => {
        if (item.group === targetRequest.bloodGroup) {
          return {
            ...item,
            bags: newStockCount,
            status: calculateStatus(newStockCount)
          };
        }
        return item;
      })
    );

    const now = new Date().toISOString();
    setBloodRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'negotiated',
              approvedUnits: parsedApproved,
              updatedAt: now
            }
          : r
      )
    );

    return { success: true };
  };

  // Admin rejects a pending blood request
  const rejectBloodRequest = (requestId) => {
    if (currentRole !== 'admin') {
      console.warn('Frontend action-level authorization error: Only administrators can reject blood requests.');
      return { success: false, error: 'Unauthorized: Only administrators can reject blood requests.' };
    }

    const targetRequest = bloodRequests.find((r) => r.id === requestId);
    if (!targetRequest) {
      return { success: false, error: 'Blood request not found.' };
    }

    if (targetRequest.status !== 'pending') {
      return { success: false, error: `Request cannot be rejected because its current status is '${targetRequest.status}'.` };
    }

    const now = new Date().toISOString();
    setBloodRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              approvedUnits: 0,
              updatedAt: now
            }
          : r
      )
    );

    return { success: true };
  };

  return (
    <BloodBankContext.Provider
      value={{
        stock,
        donors,
        bloodRequests,
        updateBagCount,
        addDonor,
        createBloodRequest,
        approveBloodRequest,
        negotiateBloodRequest,
        rejectBloodRequest
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
