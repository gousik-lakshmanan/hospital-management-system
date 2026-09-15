import React, { createContext, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { ROLE_PERMISSIONS } from '../config/rolePermissions';

export const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const { currentRole } = useContext(AuthContext);

  const hasPermission = (permission) => {
    if (!currentRole) return false;
    const permissions = ROLE_PERMISSIONS[currentRole] || [];
    return permissions.includes(permission);
  };

  const hasModuleAccess = (moduleName) => {
    // Standard mapping from path segment to permission code
    const map = {
      'dashboard': 'dashboard',
      'patients': 'patients',
      'appointments': 'appointments',
      'doctors': 'doctors',
      'nurses': 'nurses',
      'rooms': 'rooms_beds',
      'pharmacy': 'pharmacy',
      'blood-bank': 'blood_bank',
      'visitors': 'visitors',
      'diet': 'diet',
      'billing': 'billing',
      'reports': 'reports',
      'notifications': 'notifications',
      'settings': 'settings',
      'health-assistant': 'ai_health_assistant',
      'diet-planner': 'ai_diet_planner',
      'report-summarizer': 'ai_report_summarizer'
    };

    const permission = map[moduleName];
    if (!permission) return false;
    return hasPermission(permission);
  };

  return (
    <PermissionContext.Provider value={{ hasPermission, hasModuleAccess }}>
      {children}
    </PermissionContext.Provider>
  );
};
