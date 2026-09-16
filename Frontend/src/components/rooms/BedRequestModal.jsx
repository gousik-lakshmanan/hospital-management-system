import React, { useState, useEffect } from 'react';
import { Bed, ArrowLeft, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useRooms } from '../../context/RoomContext';

export const BedRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { rooms, createBedRequest } = useRooms();

  const [step, setStep] = useState(1);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedSection(null);
      setIsSubmitting(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Live section details
  const liveSection = selectedSection
    ? rooms.find((r) => (r.roomNumber || r.roomId) === (selectedSection.roomNumber || selectedSection.roomId))
    : null;

  const currentAvailableBeds = liveSection
    ? (liveSection.beds || []).filter((b) => (b.status || '').toUpperCase() === 'AVAILABLE').length
    : 0;

  const handleSelectSection = (room) => {
    const available = (room.beds || []).filter((b) => (b.status || '').toUpperCase() === 'AVAILABLE').length;
    if (available <= 0) return;

    setSelectedSection(room);
    setErrorMessage(null);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedSection || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const sectionId = selectedSection.roomId || selectedSection.roomNumber;
    const result = await createBedRequest(sectionId);

    if (result.success) {
      setIsSubmitting(false);
      onClose();
      if (onSuccess) {
        onSuccess(result.request);
      }
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Bed className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-800">
              {step === 1 ? 'Request a Bed – Select Section' : `Request Bed in ${selectedSection?.type || selectedSection?.roomName}`}
            </span>
            <span className="block text-[11px] font-normal text-slate-500">
              {step === 1 ? 'Step 1 of 2: Which section would you like a bed in?' : 'Step 2 of 2: Confirm your bed space request'}
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
              Back to Sections
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
                disabled={isSubmitting || currentAvailableBeds <= 0}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
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
          <p className="text-xs text-slate-600 font-medium">
            Which section would you like a bed in? Select from currently available hospital room sections:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rooms.map((room) => {
              const available = (room.beds || []).filter(
                (b) => (b.status || '').toUpperCase() === 'AVAILABLE'
              ).length;
              const isFull = available <= 0;
              const sectionId = room.roomId || room.roomNumber;
              const sectionName = room.roomName || room.type;

              return (
                <button
                  key={sectionId}
                  type="button"
                  onClick={() => handleSelectSection(room)}
                  disabled={isFull}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 group flex items-center justify-between shadow-2xs ${
                    isFull
                      ? 'border-slate-200 bg-slate-100/70 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isFull
                          ? 'bg-slate-200 text-slate-400'
                          : 'bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform'
                      }`}
                    >
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-800 block group-hover:text-blue-600 transition-colors">
                        {sectionName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        {sectionId} · {room.capacity || room.totalBeds} Total Beds
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isFull ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        Currently Full
                      </span>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-emerald-700 block">
                          {available} Available
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          Select Section →
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              You are requesting a room section only. Hospital administration will assign an exact bed space for you upon review.
            </span>
          </div>
        </div>
      )}

      {step === 2 && selectedSection && (
        <div className="space-y-4 py-1">
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{errorMessage}</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Please choose another section or wait for bed availability to update.
                </p>
              </div>
            </div>
          )}

          {/* Selected Section Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/30">
                  <Bed className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{selectedSection.roomName || selectedSection.type}</h4>
                  <span className="text-xs font-mono text-slate-500">{selectedSection.roomId || selectedSection.roomNumber}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Availability</span>
                <span
                  className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    currentAvailableBeds > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {currentAvailableBeds > 0 ? `${currentAvailableBeds} Beds Vacant` : '0 Beds Available'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Bed Quantity:</span>
                <span className="font-bold text-slate-800">1 Bed Space</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Section Allocation:</span>
                <span className="font-semibold text-slate-700">{selectedSection.roomName || selectedSection.type} Department</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Clicking <strong>Send Request</strong> submits your request to the administrator. Actual bed space will be allocated upon administrative confirmation.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BedRequestModal;
