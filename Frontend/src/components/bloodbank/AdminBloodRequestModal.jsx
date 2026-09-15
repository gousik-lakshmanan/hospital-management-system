import React, { useState, useEffect } from 'react';
import { Droplet, CheckCircle, Sliders, XCircle, AlertTriangle, Plus, Minus, ShieldAlert } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useBloodBank } from '../../context/BloodBankContext';

export const AdminBloodRequestModal = ({ isOpen, onClose, request, actionType }) => {
  const { stock, approveBloodRequest, negotiateBloodRequest, rejectBloodRequest } = useBloodBank();

  const [negotiatedUnits, setNegotiatedUnits] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Find live stock for requested blood group
  const targetStock = request
    ? stock.find((s) => s.group === request.bloodGroup)
    : null;
  const currentAvailable = targetStock ? targetStock.bags : 0;
  const maxNegotiable = request ? Math.min(request.requestedUnits, currentAvailable) : 0;

  useEffect(() => {
    if (isOpen && request) {
      setNegotiatedUnits(Math.min(1, maxNegotiable || 1));
      setIsProcessing(false);
      setErrorMessage(null);
    }
  }, [isOpen, request, maxNegotiable]);

  if (!request) return null;

  const handleApproveConfirm = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const result = approveBloodRequest(request.id);
    if (result.success) {
      setIsProcessing(false);
      onClose();
    } else {
      setIsProcessing(false);
      setErrorMessage(result.error);
    }
  };

  const handleNegotiateConfirm = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const result = negotiateBloodRequest(request.id, negotiatedUnits);
    if (result.success) {
      setIsProcessing(false);
      onClose();
    } else {
      setIsProcessing(false);
      setErrorMessage(result.error);
    }
  };

  const handleRejectConfirm = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const result = rejectBloodRequest(request.id);
    if (result.success) {
      setIsProcessing(false);
      onClose();
    } else {
      setIsProcessing(false);
      setErrorMessage(result.error);
    }
  };

  const isStockInsufficientForFullApproval = currentAvailable < request.requestedUnits;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              actionType === 'approve'
                ? 'bg-emerald-100 text-emerald-600'
                : actionType === 'negotiate'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            {actionType === 'approve' ? (
              <CheckCircle className="w-4 h-4" />
            ) : actionType === 'negotiate' ? (
              <Sliders className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-base font-bold text-slate-800">
              {actionType === 'approve'
                ? 'Approve Blood Request'
                : actionType === 'negotiate'
                ? 'Negotiate Blood Request'
                : 'Reject Blood Request'}
            </span>
            <span className="block text-[11px] font-normal text-slate-500">
              Request ID: {request.id}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={onClose} className="text-xs" disabled={isProcessing}>
            Cancel
          </Button>

          {actionType === 'approve' && (
            <Button
              variant="primary"
              icon={CheckCircle}
              onClick={handleApproveConfirm}
              disabled={isProcessing || isStockInsufficientForFullApproval}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
            >
              {isProcessing ? 'Approving...' : `Approve ${request.requestedUnits} Units`}
            </Button>
          )}

          {actionType === 'negotiate' && (
            <Button
              variant="primary"
              icon={Sliders}
              onClick={handleNegotiateConfirm}
              disabled={isProcessing || currentAvailable <= 0 || negotiatedUnits < 1 || negotiatedUnits > maxNegotiable}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
            >
              {isProcessing ? 'Saving...' : `Approve ${negotiatedUnits} Units`}
            </Button>
          )}

          {actionType === 'reject' && (
            <Button
              variant="danger"
              icon={XCircle}
              onClick={handleRejectConfirm}
              disabled={isProcessing}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20"
            >
              {isProcessing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Request Summary Info */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
            <span className="text-slate-500">Requester:</span>
            <span className="font-bold text-slate-800">
              {request.requesterName}{' '}
              <span className="text-[10px] text-slate-500 font-normal capitalize">
                ({request.requesterRole})
              </span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Requested Blood Group:</span>
            <span className="font-extrabold text-rose-600 inline-flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 fill-rose-600" />
              {request.bloodGroup}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Requested Quantity:</span>
            <span className="font-bold text-slate-800">{request.requestedUnits} Units</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Current Available Stock:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                currentAvailable < request.requestedUnits
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {currentAvailable} Units in Repository
            </span>
          </div>
        </div>

        {/* APPROVE MODE */}
        {actionType === 'approve' && (
          <div>
            {isStockInsufficientForFullApproval ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Insufficient Available Stock for Full Approval</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  The requester asked for <strong>{request.requestedUnits} units</strong>, but only{' '}
                  <strong>{currentAvailable} units</strong> of {request.bloodGroup} are currently available.
                  Please use the <strong>Negotiate</strong> action to approve a partial quantity, or reject this request.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Approving will deduct <strong>{request.requestedUnits} units</strong> of{' '}
                  <strong>{request.bloodGroup}</strong> blood from available inventory. New stock will be{' '}
                  <strong>{currentAvailable - request.requestedUnits} units</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* NEGOTIATE MODE */}
        {actionType === 'negotiate' && (
          <div className="space-y-4">
            {currentAvailable <= 0 ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <p className="font-bold">No Units Available</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Currently 0 units of {request.bloodGroup} blood are available. You cannot negotiate an approval quantity at this time.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-indigo-50/30 border border-blue-200/80">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Adjust Approved Quantity
                </span>

                <div className="flex items-center gap-6 my-2">
                  <button
                    type="button"
                    onClick={() => setNegotiatedUnits((prev) => Math.max(1, prev - 1))}
                    disabled={negotiatedUnits <= 1 || isProcessing}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border text-slate-700 transition-all duration-150 ${
                      negotiatedUnits <= 1 || isProcessing
                        ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'border-slate-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-95 shadow-xs cursor-pointer'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="min-w-24 text-center">
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {negotiatedUnits}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      Approved Units
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNegotiatedUnits((prev) => Math.min(maxNegotiable, prev + 1))}
                    disabled={negotiatedUnits >= maxNegotiable || isProcessing}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-150 ${
                      negotiatedUnits >= maxNegotiable || isProcessing
                        ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'border-slate-300 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 active:scale-95 text-slate-700 shadow-xs cursor-pointer'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 text-center">
                  {negotiatedUnits >= maxNegotiable ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Maximum available blood units reached ({maxNegotiable} units)
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Allowed range: 1 to {maxNegotiable} units
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REJECT MODE */}
        {actionType === 'reject' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
            <p className="font-bold">Are you sure you want to reject this blood request?</p>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Rejecting will mark the request status as "Rejected" and will not deduct any blood bags from the hospital inventory.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdminBloodRequestModal;
