import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DEFAULT_DASHBOARD_ROUTES } from '../../config/constants';
import Button from '../../components/common/Button';

export const Unauthorized = () => {
  const { currentRole } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (currentRole && DEFAULT_DASHBOARD_ROUTES[currentRole]) {
      navigate(DEFAULT_DASHBOARD_ROUTES[currentRole]);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Access Denied</h1>
      <p className="text-sm text-slate-500 max-w-sm mt-2 mb-8">
        Your logged-in role does not have authorization permissions to access this clinical module or administrative page.
      </p>

      <Button
        onClick={handleGoHome}
        variant="primary"
        icon={ChevronLeft}
      >
        Return to Dashboard
      </Button>
      
      <span className="text-[10px] text-slate-400 mt-12 block">
        Security Protected by MediSync AI Routing Engine
      </span>
    </div>
  );
};

export default Unauthorized;
