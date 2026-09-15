import React, { useState, useEffect } from 'react';
import { Bed, User, AlertCircle, CheckCircle2, ShieldAlert, Hospital } from 'lucide-react';
import { mockPatients } from '../../data/mockData';
import { useRooms } from '../../context/RoomContext';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const AllocateBedModal = ({ isOpen, onClose, initialRoomNumber = '' }) => {
  const { rooms, getAvailableBeds, allocateBed } = useRooms();

  // If initialRoomNumber is provided, we are in Per-Room mode. Otherwise, Master mode.
  const isMasterMode = !initialRoomNumber;

  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset and sync state when modal opens or initialRoomNumber changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSelectedPatientId('');
      if (initialRoomNumber) {
        setSelectedRoomNumber(initialRoomNumber);
        const beds = getAvailableBeds(initialRoomNumber);
        setSelectedBedId(beds.length > 0 ? beds[0].id : '');
      } else {
        setSelectedRoomNumber('');
        setSelectedBedId('');
      }
    }
  }, [isOpen, initialRoomNumber]);

  // Available beds for currently selected room (in either mode)
  const availableBeds = selectedRoomNumber ? getAvailableBeds(selectedRoomNumber) : [];

  // Handler for room change in Master mode
  const handleRoomChange = (newRoomNumber) => {
    setSelectedRoomNumber(newRoomNumber);
    setSelectedBedId(''); // Clear previous bed selection immediately
    if (newRoomNumber) {
      const beds = getAvailableBeds(newRoomNumber);
      if (beds.length > 0) {
        setSelectedBedId(beds[0].id);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedRoomNumber) {
      setErrorMessage('Please select a Room / Unit.');
      return;
    }

    if (!selectedBedId) {
      setErrorMessage('Please select an available bed space.');
      return;
    }

    if (!selectedPatientId) {
      setErrorMessage('Please select a registered patient.');
      return;
    }

    const patientObj = mockPatients.find(p => p.id === selectedPatientId);
    const patientName = patientObj ? patientObj.name : '';

    const result = allocateBed({
      roomNumber: selectedRoomNumber,
      bedId: selectedBedId,
      patientId: selectedPatientId,
      patientName
    });

    if (result.success) {
      // Close popup immediately so user sees the bed transition on the main page
      onClose();
    } else {
      setErrorMessage(result.error || 'Failed to allocate bed space.');
    }
  };

  const selectedRoomObj = rooms.find(r => r.roomNumber === selectedRoomNumber);
  const selectedBedObj = availableBeds.find(b => b.id === selectedBedId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        !isMasterMode && selectedRoomObj
          ? `Allocate Bed Space — ${selectedRoomObj.type} (${selectedRoomObj.roomNumber})`
          : 'Allocate Bed Space'
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedRoomNumber || availableBeds.length === 0 || !selectedPatientId || !selectedBedId}
          >
            Confirm Allocation
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. MASTER MODE ONLY: Room / Unit Selection Dropdown */}
        {isMasterMode ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Room / Unit <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedRoomNumber}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all font-medium"
              required
            >
              <option value="">-- Select Room / Unit --</option>
              {rooms.map((r) => {
                const freeCount = r.beds.filter(b => (b.status || '').toUpperCase() === 'AVAILABLE').length;
                return (
                  <option key={r.roomNumber} value={r.roomNumber}>
                    {r.type} ({r.roomNumber}) — {freeCount} of {r.totalBeds} available
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Select the target room or suite to load its available bed spaces.
            </p>
          </div>
        ) : (
          /* PER-ROOM MODE: Display Read-Only Section Banner (No dropdown) */
          selectedRoomObj && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  <Hospital className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Target Room / Section
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedRoomObj.type} ({selectedRoomObj.roomNumber})
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  availableBeds.length > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {availableBeds.length} / {selectedRoomObj.totalBeds} Available
              </span>
            </div>
          )
        )}

        {/* 2. Bed Space Selection Dropdown (Dynamically Filtered) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bed Space <span className="text-rose-500">*</span>
          </label>
          {!selectedRoomNumber ? (
            <select
              disabled
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400 cursor-not-allowed"
            >
              <option value="">Select a room first</option>
            </select>
          ) : availableBeds.length > 0 ? (
            <select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all font-medium"
              required
            >
              <option value="">-- Select Available Bed --</option>
              {availableBeds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  {bed.bedNumber} ({bed.id}) — Available
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>No available bed spaces in this section. All beds are currently occupied.</span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedRoomNumber
              ? `Only available bed spaces in ${selectedRoomObj?.type || selectedRoomNumber} are shown.`
              : 'Choose a room to view its available bed spaces.'}
          </p>
        </div>

        {/* 3. Patient Selection Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Patient Directory <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
            required
          >
            <option value="">-- Choose Registered Patient --</option>
            {mockPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — Status: {p.status}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Select the patient to be assigned to the selected bed space.
          </p>
        </div>

        {/* 4. Live Allocation Summary Preview */}
        {selectedRoomObj && selectedBedObj && selectedPatientId && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-blue-900 block">Allocation Summary</span>
            <div className="text-slate-600 flex justify-between">
              <span>Unit:</span>
              <span className="font-medium text-slate-800">{selectedRoomObj.type} ({selectedRoomObj.roomNumber})</span>
            </div>
            <div className="text-slate-600 flex justify-between">
              <span>Bed Space:</span>
              <span className="font-medium text-blue-700">{selectedBedObj.bedNumber} ({selectedBedObj.id})</span>
            </div>
            <div className="text-slate-600 flex justify-between">
              <span>Patient:</span>
              <span className="font-medium text-slate-800">
                {mockPatients.find(p => p.id === selectedPatientId)?.name}
              </span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AllocateBedModal;
