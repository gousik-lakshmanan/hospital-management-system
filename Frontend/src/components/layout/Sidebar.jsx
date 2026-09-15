import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { navigationConfig } from '../../config/navigationConfig';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS } from '../../config/constants';
import SignOutConfirmModal from './SignOutConfirmModal';

export const Sidebar = ({ isOpen, onClose }) => {
  const { currentRole, user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  if (!currentRole) return null;

  // Render Lucide Icon dynamically
  const IconRenderer = ({ name, className = 'w-5 h-5' }) => {
    const IconComponent = Icons[name];
    return IconComponent ? <IconComponent className={className} /> : <Icons.HelpCircle className={className} />;
  };

  const handleSignOutClick = () => {
    setIsSignOutModalOpen(true);
  };

  const handleSignOutConfirm = () => {
    setIsSignOutModalOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/30">
              M
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base leading-none block">MediSync AI</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide block mt-0.5">HOSPITAL SYSTEM</span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-slate-800 truncate">{user?.name}</h4>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                {ROLE_LABELS[currentRole]}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Config Render */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navigationConfig.map((section, idx) => {
            // Filter allowed items for the role
            let allowedItems = section.items.filter(item => hasPermission(item.permission));

            // Pharmacist Custom Rule: Move Pharmacy right after Dashboard
            if (section.section === 'MAIN' && currentRole === 'pharmacist') {
              const mainItems = [...allowedItems];
              const pharmIdx = mainItems.findIndex(i => i.permission === 'pharmacy');
              const dashIdx = mainItems.findIndex(i => i.permission === 'dashboard');
              if (pharmIdx > -1 && dashIdx > -1) {
                const [pharmItem] = mainItems.splice(pharmIdx, 1);
                mainItems.splice(dashIdx + 1, 0, pharmItem);
              }
              allowedItems = mainItems;
            }

            if (allowedItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1.5">
                <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {section.section}
                </span>
                
                <div className="space-y-0.5">
                  {allowedItems.map((item, itemIdx) => {
                    // Replace :role placeholder in path with the active role
                    const finalPath = item.path.replace('/:role', `/${currentRole}`);
                    const isActive = location.pathname === finalPath;

                    return (
                      <NavLink
                        key={itemIdx}
                        to={finalPath}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <IconRenderer
                          name={item.icon}
                          className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}`}
                        />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Global Sign Out Button & Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <button
            type="button"
            onClick={handleSignOutClick}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
          >
            <Icons.LogOut className="w-5 h-5 text-red-500" />
            <span>Sign Out</span>
          </button>

          <div className="text-center pt-1">
            <p className="text-[10px] text-slate-400">SIH 2026 Presentation Ready</p>
          </div>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOutConfirm}
      />
    </>
  );
};

export default Sidebar;
