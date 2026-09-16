import React, { useState, useEffect } from 'react';
import { Bed, User, AlertCircle, CheckCircle2, ShieldAlert, Hospital } from 'lucide-react';
import { useRooms } from '../../context/RoomContext';
import { patientService } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const AllocateBedModal = ({ isOpen, onClose, initialRoomNumber = '' }) => {
  const { rooms, getAvailableBeds, allocateBed } = useRooms();

  const isMasterMode = !initialRoomNumber;

  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientList, setPatientList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch real registered patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await patientService.getPatients();
        if (res.success && Array.isArray(res.patients)) {
          setPatientList(
            res.patients.map((p) => ({
              id: p.userId || p._id,
              name: p.name,
              status: p.status || 'Outpatient',
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load patients for bed allocation:', err);
      }
    };

    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  // Reset and sync state when modal opens or initialRoomNumber changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSelectedPatientId('');
      setIsSubmitting(false);
      if (initialRoomNumber) {
        setSelectedRoomNumber(initialRoomNumber);
        const beds = getAvailableBeds(initialRoomNumber);
        setSelectedBedId(beds.length > 0 ? (beds[0]._id || beds[0].id) : '');
      } else {
        setSelectedRoomNumber('');
        setSelectedBedId('');
      }
    }
  }, [isOpen, initialRoomNumber]);

  // Available beds for currently selected room
  const availableBeds = selectedRoomNumber ? getAvailableBeds(selectedRoomNumber) : [];

  const handleRoomChange = (newRoomNumber) => {
    setSelectedRoomNumber(newRoomNumber);
    setSelectedBedId('');
    if (newRoomNumber) {
      const beds = getAvailableBeds(newRoomNumber);
      if (beds.length > 0) {
        setSelectedBedId(beds[0]._id || beds[0].id);
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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

    setIsSubmitting(true);

    const patientObj = patientList.find((p) => p.id === selectedPatientId);
    const patientName = patientObj ? patientObj.name : '';

    const result = await allocateBed({
      roomNumber: selectedRoomNumber,
      bedId: selectedBedId,
      patientId: selectedPatientId,
      patientName,
    });

    if (result.success) {
      setIsSubmitting(false);
      onClose();
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.error || 'Failed to allocate bed space.');
    }
  };

  const selectedRoomObj = rooms.find(
    (r) => (r.roomNumber || r.roomId) === selectedRoomNumber
  );
  const selectedBedObj = availableBeds.find(
    (b) => (b._id || b.id) === selectedBedId
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        !isMasterMode && selectedRoomObj
          ? `Allocate Bed Space — ${selectedRoomObj.type || selectedRoomObj.roomName} (${selectedRoomObj.roomNumber || selectedRoomObj.roomId})`
          : 'Allocate Bed Space'
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedRoomNumber ||
              availableBeds.length === 0 ||
              !selectedPatientId ||
              !selectedBedId
            }
          >
            {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
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
                const roomNum = r.roomNumber || r.roomId;
                const roomName = r.type || r.roomName;
                const freeCount = (r.beds || []).filter(
                  (b) => (b.status || '').toUpperCase() === 'AVAILABLE'
                ).length;
                return (
                  <option key={roomNum} value={roomNum}>
                    {roomName} ({roomNum}) — {freeCount} of {r.capacity || r.totalBeds} available
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Select the target room or suite to load its available bed spaces.
            </p>
          </div>
        ) : (
          /* PER-ROOM MODE: Display Read-Only Section Banner */
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
                    {selectedRoomObj.type || selectedRoomObj.roomName} ({selectedRoomObj.roomNumber || selectedRoomObj.roomId})
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
                {availableBeds.length} / {selectedRoomObj.capacity || selectedRoomObj.totalBeds} Available
              </span>
            </div>
          )
        )}

        {/* 2. Bed Space Selection Dropdown */}
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
              {availableBeds.map((bed) => {
                const bedIdentifier = bed._id || bed.id;
                return (
                  <option key={bedIdentifier} value={bedIdentifier}>
                    {bed.bedNumber} ({bedIdentifier}) — Available
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>No available bed spaces in this section. All beds are currently occupied.</span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedRoomNumber
              ? `Only available bed spaces in ${selectedRoomObj?.type || selectedRoomObj?.roomName || selectedRoomNumber} are shown.`
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
            {patientList.map((p) => (
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
              <span className="font-medium text-slate-800">
                {selectedRoomObj.type || selectedRoomObj.roomName} ({selectedRoomObj.roomNumber || selectedRoomObj.roomId})
              </span>
            </div>
            <div className="text-slate-600 flex justify-between">
              <span>Bed Space:</span>
              <span className="font-medium text-blue-700">
                {selectedBedObj.bedNumber} ({selectedBedObj._id || selectedBedObj.id})
              </span>
            </div>
            <div className="text-slate-600 flex justify-between">
              <span>Patient:</span>
              <span className="font-medium text-slate-800">
                {patientList.find((p) => p.id === selectedPatientId)?.name}
              </span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AllocateBedModal;
