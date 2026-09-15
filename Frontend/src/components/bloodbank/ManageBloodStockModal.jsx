import React, { useState, useEffect } from 'react';
import { Droplet, Plus, Minus, ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useBloodBank } from '../../context/BloodBankContext';

export const ManageBloodStockModal = ({ isOpen, onClose }) => {
  const { stock, updateBagCount } = useBloodBank();

  // Step 1: Select Group, Step 2: Adjust Count
  const [step, setStep] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [bagCount, setBagCount] = useState(0);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedGroup(null);
      setBagCount(0);
    }
  }, [isOpen]);

  const handleSelectGroup = (item) => {
    setSelectedGroup(item);
    setBagCount(item.bags);
    setStep(2);
  };

  const handleIncrement = () => {
    setBagCount((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setBagCount((prev) => Math.max(0, prev - 1));
  };

  const handleSave = () => {
    if (selectedGroup) {
      updateBagCount(selectedGroup.group, bagCount);
      onClose();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Emergency Alert':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Low Stock':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <Droplet className="w-4 h-4 fill-red-600" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-800">
              {step === 1 ? 'Manage Blood Stock – Select Blood Group' : `Update Stock – Group ${selectedGroup?.group}`}
            </span>
            <span className="block text-[11px] font-normal text-slate-500">
              {step === 1 ? 'Step 1 of 2: Choose a blood group to adjust inventory' : 'Step 2 of 2: Modify total available bag count'}
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
              onClick={() => setStep(1)}
              className="text-xs"
            >
              Back to Groups
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            {step === 2 && (
              <Button
                variant="primary"
                icon={Check}
                onClick={handleSave}
                className="text-xs bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-md shadow-red-500/20"
              >
                Save Stock Update
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Click on any blood group below to inspect its inventory and adjust the physical bag count:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stock.map((item) => {
              const badgeClass = getStatusBadge(item.status);
              return (
                <button
                  key={item.group}
                  type="button"
                  onClick={() => handleSelectGroup(item)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-red-400 bg-slate-50/60 hover:bg-red-50/40 text-left transition-all duration-200 group flex flex-col justify-between h-28 shadow-2xs hover:shadow-sm cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-lg font-black text-slate-800 group-hover:text-red-600 transition-colors">
                      {item.group}
                    </span>
                    <Droplet className="w-4 h-4 text-red-500 fill-red-500 group-hover:scale-110 transition-transform" />
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-700">
                      {item.bags} <span className="text-xs font-medium text-slate-500">Bags</span>
                    </div>
                    <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${badgeClass}`}>
                      {item.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && selectedGroup && (
        <div className="space-y-6 py-2">
          {/* Group Overview Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm shadow-red-500/30">
                {selectedGroup.group}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800">Blood Group {selectedGroup.group}</span>
                <span className="block text-xs text-slate-500">
                  Baseline Current Stock: <strong className="text-slate-700">{selectedGroup.bags} Bags</strong>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Status</span>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                  bagCount <= 2 ? 'Emergency Alert' : bagCount <= 5 ? 'Low Stock' : 'Normal'
                )}`}
              >
                {bagCount <= 2 ? 'Emergency Alert' : bagCount <= 5 ? 'Low Stock' : 'Normal'}
              </span>
            </div>
          </div>

          {/* Counter Control Section */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50/80 to-slate-100/60 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Adjust Bag Inventory
            </span>

            <div className="flex items-center gap-6">
              {/* Decrement Button */}
              <button
                type="button"
                onClick={handleDecrement}
                disabled={bagCount <= 0}
                className={`w-12 h-12 rounded-xl flex items-center justify-center border text-slate-700 transition-all duration-150 ${
                  bagCount <= 0
                    ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 active:scale-95 shadow-xs'
                }`}
                title={bagCount <= 0 ? 'Minimum count is 0' : 'Decrease by 1'}
              >
                <Minus className="w-5 h-5" />
              </button>

              {/* Display Count */}
              <div className="min-w-28 text-center">
                <div className="text-4xl font-black text-slate-900 tracking-tight">
                  {bagCount}
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {bagCount === 1 ? 'Bag Available' : 'Bags Available'}
                </div>
              </div>

              {/* Increment Button */}
              <button
                type="button"
                onClick={handleIncrement}
                className="w-12 h-12 rounded-xl flex items-center justify-center border border-slate-300 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 active:scale-95 text-slate-700 shadow-xs transition-all duration-150"
                title="Increase by 1"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Change difference pill */}
            <div className="mt-4">
              {bagCount === selectedGroup.bags ? (
                <span className="text-xs text-slate-400 font-medium">No changes made yet</span>
              ) : bagCount > selectedGroup.bags ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  +{bagCount - selectedGroup.bags} bags will be added
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  -{selectedGroup.bags - bagCount} bags will be deducted
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Administrator modification directly updates the hospital blood bank repository across all persona dashboards. Minimum limit is 0 bags.
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ManageBloodStockModal;
