import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pharmacyService } from '../services/pharmacyService';
import { NotificationContext } from './NotificationContext';
import { useAuth } from '../hooks/useAuth';

export const PharmacyContext = createContext();

export const PharmacyProvider = ({ children }) => {
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx ? notifCtx.addNotification : null;
  const { user } = useAuth();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMedicines = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await pharmacyService.getMedicines(params);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(m => ({
          ...m,
          id: m._id,
          type: m.category,
          stock: m.quantity,
          threshold: m.reorderLevel,
          price: m.unitPrice,
          expiryDate: m.expiryDate ? new Date(m.expiryDate).toISOString().split('T')[0] : '',
        }));
        setMedicines(mapped);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch medicines from MongoDB:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMedicines();
    }
  }, [user, fetchMedicines]);

  // Derived stats
  const totalFormulations = medicines.length;
  const lowStockCount = medicines.filter(m => m.status === 'LOW STOCK').length;
  const outOfStockCount = medicines.filter(m => m.status === 'OUT OF STOCK').length;
  const expiringSoonCount = medicines.filter(m => m.status === 'EXPIRING SOON' || m.status === 'EXPIRED').length;

  const createMedicine = async (medicineData) => {
    try {
      const res = await pharmacyService.createMedicine(medicineData);
      if (res.success) {
        await fetchMedicines();
        if (addNotification) {
          addNotification('Medicine Registered', `Formulation '${res.data.name}' added to inventory.`, 'System');
        }
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Creation failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create medicine';
      return { success: false, message: msg };
    }
  };

  const updateMedicine = async (id, medicineData) => {
    try {
      const res = await pharmacyService.updateMedicine(id, medicineData);
      if (res.success) {
        await fetchMedicines();
        if (addNotification) {
          addNotification('Medicine Updated', `Formulation '${res.data.name}' updated.`, 'System');
        }
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Update failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update medicine';
      return { success: false, message: msg };
    }
  };

  const deactivateMedicine = async (id) => {
    try {
      const res = await pharmacyService.deactivateMedicine(id);
      if (res.success) {
        await fetchMedicines();
        if (addNotification) {
          addNotification('Medicine Deactivated', `Formulation deactivated.`, 'System');
        }
        return { success: true };
      }
      return { success: false, message: res.message || 'Deactivation failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to deactivate medicine';
      return { success: false, message: msg };
    }
  };

  const adjustStock = async (id, change) => {
    try {
      const res = await pharmacyService.adjustStock(id, change);
      if (res.success) {
        await fetchMedicines();
        if (addNotification) {
          addNotification('Stock Adjusted', res.message || 'Medicine stock updated.', 'System');
        }
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Stock adjustment failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to adjust stock';
      return { success: false, message: msg };
    }
  };

  return (
    <PharmacyContext.Provider
      value={{
        medicines,
        loading,
        error,
        totalFormulations,
        lowStockCount,
        outOfStockCount,
        expiringSoonCount,
        fetchMedicines,
        createMedicine,
        updateMedicine,
        deactivateMedicine,
        adjustStock,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};

export default PharmacyContext;
