import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import Unauthorized from '../pages/auth/Unauthorized';

export const RoleRoute = ({ children, module }) => {
  const { hasModuleAccess } = usePermissions();

  if (!hasModuleAccess(module)) {
    return <Unauthorized />;
  }

  return children;
};

export default RoleRoute;
