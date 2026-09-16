import React, { useState, useEffect } from 'react';
import { Bed, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useRooms } from '../../context/RoomContext';
import { roomService } from '../../services/roomService';

export const AcceptBedRequestModal = ({ isOpen, onClose, request, onSuccess }) => {
  const { acceptBedRequest, getAvailableBeds } = useRooms();

  const [availableBeds, setAvailableBeds] = useState([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchBeds = async () => {
      if (isOpen && request && request.sectionId) {
        setIsProcessing(false);
        setErrorMessage(null);
        try {
          const res = await roomService.getAvailableBeds(request.sectionId);
          const beds = (res.data || []).map(b => ({ ...b, id: b._id || b.bedNumber }));
          setAvailableBeds(beds);
          setSelectedBedId(beds.length > 0 ? (beds[0]._id || beds[0].id) : '');
        } catch (err) {
          const fallback = getAvailableBeds(request.sectionId);
          setAvailableBeds(fallback);
          setSelectedBedId(fallback.length > 0 ? (fallback[0]._id || fallback[0].id) : '');
        }
      }
    };

    fetchBeds();
  }, [isOpen, request, getAvailableBeds]);

  if (!request) return null;

  const handleAcceptConfirm = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedBedId || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const requestId = request.id || request._id;
    const result = await acceptBedRequest(requestId, selectedBedId);

    if (result.success) {
      setIsProcessing(false);
      onClose();
      if (onSuccess) {
        onSuccess(result);
      }
    } else {
      setIsProcessing(false);
      setErrorMessage(result.message);
      // Re-fetch fresh available beds
      try {
        const res = await roomService.getAvailableBeds(request.sectionId);
        const beds = (res.data || []).map(b => ({ ...b, id: b._id || b.bedNumber }));
        setAvailableBeds(beds);
        if (!beds.some((b) => (b._id || b.id) === selectedBedId)) {
          setSelectedBedId(beds.length > 0 ? (beds[0]._id || beds[0].id) : '');
        }
      } catch (e) {
        // ignore
      }
    }
  };

  const isNoBedsAvailable = availableBeds.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-800">Accept Bed Request</span>
            <span className="block text-[11px] font-normal text-slate-500">
              Assign and allocate an available bed in {request.sectionName}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={onClose} className="text-xs" disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={CheckCircle2}
            onClick={handleAcceptConfirm}
            disabled={isProcessing || isNoBedsAvailable || !selectedBedId}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
          >
            {isProcessing ? 'Allocating...' : 'Accept & Allocate Bed'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{errorMessage}</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Please select another currently available bed space.
              </p>
            </div>
          </div>
        )}

        {/* Request Overview */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
            <span className="text-slate-500">Patient:</span>
            <span className="font-bold text-slate-800">
              {request.requesterName}{' '}
              <span className="text-[10px] text-slate-400 font-mono">({request.requesterId})</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Requested Section:</span>
            <span className="font-bold text-slate-800">
              {request.sectionName} ({request.sectionId})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Current Section Availability:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isNoBedsAvailable ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {availableBeds.length} Available Bed Space{availableBeds.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Bed Selection */}
        {isNoBedsAvailable ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>No beds are currently available in this section.</span>
            </div>
            <p className="text-[11px] text-amber-700">
              All beds in {request.sectionName} are currently occupied. You cannot allocate a bed until space is released.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Available Bed to Allocate:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
              {availableBeds.map((bed) => {
                const bedIdentifier = bed._id || bed.id;
                const isSelected = selectedBedId === bedIdentifier;
                return (
                  <button
                    key={bedIdentifier}
                    type="button"
                    onClick={() => {
                      setSelectedBedId(bedIdentifier);
                      setErrorMessage(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs">{bed.bedNumber}</span>
                      <Bed className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      {bedIdentifier}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Accepting marks the selected bed as <strong>OCCUPIED</strong> and assigns the patient to it.
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default AcceptBedRequestModal;
