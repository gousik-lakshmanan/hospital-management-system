import React from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const SignOutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-800">Sign Out Confirmation</span>
            <span className="block text-[11px] font-normal text-slate-500">
              End your active session in MediSync AI
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            variant="danger"
            icon={LogOut}
            onClick={onConfirm}
            className="text-xs bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20"
          >
            Yes, Sign Out
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-1">Are you sure you want to sign out?</p>
            <p className="text-amber-800 leading-relaxed">
              You will be disconnected from your current session. Any unsaved form entries will be lost, and you will need to sign in again to access your dashboard.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SignOutConfirmModal;
