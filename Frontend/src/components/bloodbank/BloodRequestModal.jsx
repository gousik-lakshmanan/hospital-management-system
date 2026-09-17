import React, { useState, useEffect } from 'react';
import { Droplet, Plus, Minus, ArrowLeft, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useBloodBank } from '../../context/BloodBankContext';

export const BloodRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { stock, createBloodRequest, refreshStock } = useBloodBank();

  const [step, setStep] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [requestedUnits, setRequestedUnits] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Reset modal state on open/close and refresh live MongoDB stock
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedGroup(null);
      setRequestedUnits(1);
      setIsSubmitting(false);
      setErrorMessage(null);
      refreshStock();
    }
  }, [isOpen, refreshStock]);

  // Find live stock for currently selected group
  const liveSelectedStock = selectedGroup
    ? stock.find((s) => (s.bloodGroup || s.group) === (selectedGroup.bloodGroup || selectedGroup.group))
    : null;
  const currentAvailable = liveSelectedStock
    ? (liveSelectedStock.units !== undefined ? liveSelectedStock.units : liveSelectedStock.bags)
    : 0;

  const handleSelectGroup = (item) => {
    const available = item.units !== undefined ? item.units : item.bags;
    if (available <= 0) return;
    setSelectedGroup(item);
    setRequestedUnits(1);
    setErrorMessage(null);
    setStep(2);
  };

  const handleIncrement = () => {
    if (requestedUnits < currentAvailable) {
      setRequestedUnits((prev) => prev + 1);
      setErrorMessage(null);
    }
  };

  const handleDecrement = () => {
    if (requestedUnits > 1) {
      setRequestedUnits((prev) => prev - 1);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup || isSubmitting) return;

    const groupName = selectedGroup.bloodGroup || selectedGroup.group;
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await createBloodRequest(groupName, requestedUnits);

    if (result.success) {
      setIsSubmitting(false);
      onClose();
      if (onSuccess) {
        onSuccess(result.request);
      }
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.error);
      if (result.currentAvailable !== undefined) {
        if (result.currentAvailable <= 0) {
          setRequestedUnits(0);
        } else if (requestedUnits > result.currentAvailable) {
          setRequestedUnits(result.currentAvailable);
        }
      }
    }
  };

  const selectedGroupName = selectedGroup ? (selectedGroup.bloodGroup || selectedGroup.group) : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <Droplet className="w-4 h-4 fill-rose-600" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-800">
              {step === 1 ? 'Request Blood Units – Select Blood Group' : `Request Blood – Group ${selectedGroupName}`}
            </span>
            <span className="block text-[11px] font-normal text-slate-500">
              {step === 1 ? 'Step 1 of 2: Choose from available hospital inventory' : 'Step 2 of 2: Select quantity to request'}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-between items-center w-full">
          {step === 2 ? (
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => {
                setStep(1);
                setErrorMessage(null);
              }}
              className="text-xs"
              disabled={isSubmitting}
            >
              Back to Groups
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs" disabled={isSubmitting}>
              Cancel
            </Button>
            {step === 2 && (
              <Button
                variant="primary"
                icon={Send}
                onClick={handleSubmit}
                disabled={isSubmitting || currentAvailable <= 0 || requestedUnits < 1 || requestedUnits > currentAvailable}
                className="text-xs bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0 shadow-md shadow-rose-500/20"
              >
                {isSubmitting ? 'Sending Request...' : 'Send Request'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select a blood group to initiate a hospital inventory request:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stock.map((item) => {
              const groupName = item.bloodGroup || item.group;
              const bagCount = item.units !== undefined ? item.units : item.bags;
              const isUnavailable = bagCount <= 0;

              return (
                <button
                  key={groupName}
                  type="button"
                  onClick={() => handleSelectGroup(item)}
                  disabled={isUnavailable}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between h-28 shadow-2xs ${
                    isUnavailable
                      ? 'border-slate-200 bg-slate-100/70 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/40 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-lg font-black ${
                        isUnavailable ? 'text-slate-400' : 'text-slate-800 group-hover:text-rose-600 transition-colors'
                      }`}
                    >
                      {groupName}
                    </span>
                    <Droplet
                      className={`w-4 h-4 ${
                        isUnavailable
                          ? 'text-slate-300'
                          : 'text-rose-500 fill-rose-500 group-hover:scale-110 transition-transform'
                      }`}
                    />
                  </div>

                  <div>
                    {isUnavailable ? (
                      <div>
                        <div className="text-xs font-bold text-slate-400">0 Units</div>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                          Currently unavailable
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-bold text-slate-700">
                          {bagCount} <span className="text-xs font-medium text-slate-500">Units</span>
                        </div>
                        <span
                          className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            item.status === 'Emergency Alert'
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : item.status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && selectedGroup && (
        <div className="space-y-5 py-1">
          {/* Error Banner if validation failed */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{errorMessage}</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Please adjust your requested units according to currently available inventory.
                </p>
              </div>
            </div>
          )}

          {/* Group Overview Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xl shadow-sm shadow-rose-500/30">
                {selectedGroupName}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800">Blood Group {selectedGroupName}</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Currently Available in Bank: <strong className="text-slate-800 font-bold">{currentAvailable} Units</strong>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Maximum Limit</span>
              <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 inline-block mt-0.5">
                {currentAvailable} Units
              </span>
            </div>
          </div>

          {currentAvailable <= 0 ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-sm font-bold text-amber-900">No Units Available</h4>
              <p className="text-xs text-amber-700">
                Units for group {selectedGroupName} were exhausted or allocated. Please return to Step 1 to select an alternate blood group.
              </p>
            </div>
          ) : (
            /* Counter Control Section */
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50/80 to-slate-100/60 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Select Requested Units
              </span>

              <div className="flex items-center gap-6">
                {/* Decrement Button */}
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={requestedUnits <= 1 || isSubmitting}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border text-slate-700 transition-all duration-150 ${
                    requestedUnits <= 1 || isSubmitting
                      ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 active:scale-95 shadow-xs cursor-pointer'
                  }`}
                  title={requestedUnits <= 1 ? 'Minimum request is 1 unit' : 'Decrease by 1'}
                >
                  <Minus className="w-5 h-5" />
                </button>

                {/* Display Count */}
                <div className="min-w-28 text-center">
                  <div className="text-4xl font-black text-slate-900 tracking-tight">
                    {requestedUnits}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                    {requestedUnits === 1 ? 'Unit Requested' : 'Units Requested'}
                  </div>
                </div>

                {/* Increment Button */}
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={requestedUnits >= currentAvailable || isSubmitting}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-150 ${
                    requestedUnits >= currentAvailable || isSubmitting
                      ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 active:scale-95 text-slate-700 shadow-xs cursor-pointer'
                  }`}
                  title={requestedUnits >= currentAvailable ? 'Maximum available units reached' : 'Increase by 1'}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="mt-4 min-h-6">
                {requestedUnits >= currentAvailable ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Maximum available blood units reached
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    Requested: {requestedUnits} of {currentAvailable} available units
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Submitting a request sends it for Administrator review. Blood stock inventory will only be deducted upon administrator approval.
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BloodRequestModal;
