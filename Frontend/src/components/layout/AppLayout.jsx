import React, { useState, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { NotificationContext } from '../../context/NotificationContext';
import { ShieldAlert, CheckCircle, Info, X } from 'lucide-react';

export const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast, clearToast } = useContext(NotificationContext);

  const getToastIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'emergency':
      case 'danger':
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (Dynamic role based) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Header */}
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1920px] mx-auto w-full">
          {children || <Outlet />}
        </main>
      </div>

      {/* Real-time Toast Notifications */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white border border-slate-200 shadow-xl rounded-xl p-4 animate-in slide-in-from-bottom-5 duration-200 flex gap-3 items-start">
          <div className="shrink-0 mt-0.5">
            {getToastIcon(toast.type)}
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-slate-800">{toast.title}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{toast.description}</p>
          </div>
          <button
            onClick={clearToast}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-0.5 hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
