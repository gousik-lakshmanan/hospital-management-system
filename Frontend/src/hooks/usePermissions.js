import { useContext } from 'react';
import { PermissionContext } from '../context/PermissionContext';

export const usePermissions = () => {
  return useContext(PermissionContext);
};
export default usePermissions;
