import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext } from './NotificationContext';
import dietPlanService from '../services/dietPlanService';

export const DietPlanContext = createContext();

export const DietPlanProvider = ({ children }) => {
  const { currentRole, isAuthenticated } = useAuth();
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx?.addNotification || (() => {});

  const [dietPlans, setDietPlans] = useState([]);
  const [myDietPlans, setMyDietPlans] = useState([]);
  const [todayTarget, setTodayTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshDietPlans = useCallback(async (params = {}) => {
    if (!isAuthenticated || (currentRole !== 'doctor' && currentRole !== 'nurse' && currentRole !== 'admin')) {
      setDietPlans([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await dietPlanService.getDietPlans(params);
      if (res.success && Array.isArray(res.data)) {
        setDietPlans(res.data);
      }
    } catch (err) {
      console.warn('Failed to load diet plans directory:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to fetch diet plans.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentRole]);

  const refreshMyDietPlans = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await dietPlanService.getMyDietPlans();
      if (res.success && Array.isArray(res.data)) {
        setMyDietPlans(res.data);
      }
    } catch (err) {
      console.warn('Failed to load personal diet plans:', err.response?.data?.message || err.message);
    }
  }, [isAuthenticated]);

  const refreshTodayTarget = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await dietPlanService.getMyTodayTarget();
      if (res.success) {
        setTodayTarget(res.data);
      }
    } catch (err) {
      console.warn('Failed to load today target:', err.response?.data?.message || err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (currentRole === 'patient') {
        refreshMyDietPlans();
        refreshTodayTarget();
      } else if (currentRole === 'doctor' || currentRole === 'nurse' || currentRole === 'admin') {
        refreshDietPlans();
        refreshMyDietPlans();
        refreshTodayTarget();
      }
    }
  }, [isAuthenticated, currentRole, refreshDietPlans, refreshMyDietPlans, refreshTodayTarget]);

  const generateDietPlan = async (questionnaire) => {
    try {
      setLoading(true);
      const res = await dietPlanService.createDietPlan(questionnaire);
      if (res.success) {
        addNotification(
          'Diet Plan Created',
          'Diet plan generated and saved successfully.',
          'success'
        );
        await refreshMyDietPlans();
        await refreshTodayTarget();
        if (currentRole === 'doctor' || currentRole === 'nurse' || currentRole === 'admin') {
          await refreshDietPlans();
        }
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate diet plan.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignDietPlan = async (planData) => {
    try {
      setLoading(true);
      const res = await dietPlanService.assignDietPlan(planData);
      if (res.success) {
        addNotification(
          'Diet Plan Assigned',
          'Diet plan assigned successfully.',
          'success'
        );
        await refreshDietPlans();
        return res;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign diet plan.';
      addNotification('Error', msg, 'danger');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DietPlanContext.Provider
      value={{
        dietPlans,
        myDietPlans,
        todayTarget,
        loading,
        error,
        refreshDietPlans,
        refreshMyDietPlans,
        refreshTodayTarget,
        generateDietPlan,
        assignDietPlan
      }}
    >
      {children}
    </DietPlanContext.Provider>
  );
};

export const useDietPlan = () => {
  const context = useContext(DietPlanContext);
  if (!context) {
    throw new Error('useDietPlan must be used within a DietPlanProvider');
  }
  return context;
};

export default DietPlanContext;
