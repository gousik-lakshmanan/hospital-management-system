import React from 'react';
import { CheckCircle2, Droplet, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const BloodRequestSuccessModal = ({ isOpen, onClose, requestDetails }) => {
  if (!requestDetails) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-800">Blood Request Sent</span>
            <span className="block text-[11px] font-normal text-slate-500">
              Submitted for administrator authorization
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end w-full">
          <Button
            variant="primary"
            onClick={onClose}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
          >
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-800">Blood Request Sent Successfully</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Your request for{' '}
            <strong className="text-slate-800 font-bold">
              {requestDetails.requestedUnits} {requestDetails.requestedUnits === 1 ? 'unit' : 'units'} of {requestDetails.bloodGroup}
            </strong>{' '}
            blood has been dispatched to hospital administration.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left max-w-sm mx-auto space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Blood Group:</span>
            <span className="font-bold text-rose-600 inline-flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 fill-rose-600" />
              {requestDetails.bloodGroup}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Requested Quantity:</span>
            <span className="font-bold text-slate-800">{requestDetails.requestedUnits} Bags / Units</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Initial Status:</span>
            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
              Pending Admin Review
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          You can track this request's status in the "My Blood Requests" section below.
        </p>
      </div>
    </Modal>
  );
};

export default BloodRequestSuccessModal;
