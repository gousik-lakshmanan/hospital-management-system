import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut, User, Settings, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationContext } from '../../context/NotificationContext';
import { ROLE_LABELS } from '../../config/constants';
import Breadcrumb from './Breadcrumb';

export const Header = ({ onMenuToggle }) => {
  const { user, logout, currentRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Extract page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard Overview';
    if (path.includes('/profile')) return 'My User Profile';
    if (path.includes('/patients')) return 'Patient Directory';
    if (path.includes('/appointments')) return 'Appointment Scheduling';
    if (path.includes('/doctors')) return 'Medical Practitioners';
    if (path.includes('/nurses')) return 'Clinical Nurses';
    if (path.includes('/rooms')) return 'Room & Bed Allocator';
    if (path.includes('/pharmacy')) return 'Pharmacy Inventory';
    if (path.includes('/blood-bank')) return 'Blood Bank Stock';
    if (path.includes('/visitors')) return 'Visitor Logbook';
    if (path.includes('/diet')) return 'Dietary Planner';
    if (path.includes('/billing')) return 'Invoices & Billing';
    if (path.includes('/reports')) return 'Reports & Analytics';
    if (path.includes('/notifications')) return 'System Notifications';
    if (path.includes('/settings')) return 'System Settings';
    if (path.includes('/ai/diet-planner')) return 'AI Diet Planner';
    if (path.includes('/ai/report-summarizer')) return 'AI Report Summarizer';
    return 'Hospital Management System';
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-none">{getPageTitle()}</h1>
          <div className="mt-1 hidden sm:block">
            <Breadcrumb />
          </div>
        </div>
      </div>

      {/* Right section: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown Container */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">Alert Center</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-blue-600 font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                        notif.unread ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-semibold text-xs text-slate-800 leading-tight">
                          {notif.title}
                        </h5>
                        <span className="text-[9px] text-slate-400 whitespace-nowrap">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {notif.description}
                      </p>
                      {notif.type === 'Emergency' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 mt-1 bg-red-50 px-1.5 py-0.25 rounded-md">
                          <ShieldAlert className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-100 px-4 py-2 text-center">
                <button
                  onClick={() => {
                    setShowNotifDropdown(false);
                    navigate(`/${currentRole}/notifications`);
                  }}
                  className="text-[11px] text-slate-500 font-semibold hover:text-slate-800"
                >
                  View all system logs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Container */}
        <div className="relative border-l border-slate-100 pl-4" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}</span>
              )}
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-semibold text-slate-700 block max-w-[120px] truncate">
                {user?.name}
              </span>
              <span className="text-[10px] text-slate-400 capitalize block leading-none">
                {ROLE_LABELS[currentRole]}
              </span>
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/20">
                <span className="text-xs font-semibold text-slate-800 block truncate">{user?.name}</span>
                <span className="text-[10px] text-slate-400 block truncate">{user?.email}</span>
              </div>
              
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  navigate('/profile');
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400" />
                My Profile
              </button>

              {currentRole === 'admin' && (
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate(`/admin/settings`);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
