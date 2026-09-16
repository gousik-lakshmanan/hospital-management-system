import React, { useState } from 'react';
import { Bed, User, CheckCircle, AlertTriangle, Plus, X, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { useRooms } from '../../context/RoomContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';

export const ManageRoomModal = ({ isOpen, onClose, roomNumber, onOpenAllocate }) => {
  const { rooms, releaseBed } = useRooms();

  const [confirmReleaseBed, setConfirmReleaseBed] = useState(null); // { id, _id, bedNumber, patientName }
  const [isReleasing, setIsReleasing] = useState(false);

  const currentRoom = rooms.find(
    (r) => (r.roomNumber || r.roomId) === roomNumber
  );
  if (!currentRoom) return null;

  const beds = currentRoom.beds || [];
  const occupiedCount = beds.filter(
    (b) => (b.status || '').toUpperCase() === 'OCCUPIED'
  ).length;
  const availableCount = beds.filter(
    (b) => (b.status || '').toUpperCase() === 'AVAILABLE'
  ).length;

  const handleConfirmRelease = async () => {
    if (!confirmReleaseBed || isReleasing) return;

    setIsReleasing(true);
    const bedId = confirmReleaseBed._id || confirmReleaseBed.id;
    await releaseBed({
      roomNumber: currentRoom.roomNumber || currentRoom.roomId,
      bedId,
    });

    setIsReleasing(false);
    setConfirmReleaseBed(null);
    onClose();
  };

  const roomDisplayName = currentRoom.type || currentRoom.roomName;
  const roomDisplayId = currentRoom.roomNumber || currentRoom.roomId;
  const roomTotalBeds = currentRoom.capacity || currentRoom.totalBeds;

  return (
    <>
      <Modal
        isOpen={isOpen && !confirmReleaseBed}
        onClose={onClose}
        title={`Bed Management — ${roomDisplayName} (${roomDisplayId})`}
        size="lg"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{availableCount} Available</span> ·{' '}
              <span className="font-semibold text-rose-600">{occupiedCount} Occupied</span> out of {roomTotalBeds} Beds
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Header Stats Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Units</span>
              <span className="text-base font-bold text-slate-800">{roomTotalBeds} Beds</span>
            </div>
            <div className="text-center border-x border-slate-200">
              <span className="text-[10px] uppercase font-bold text-rose-500 block tracking-wider">Occupied</span>
              <span className="text-base font-bold text-rose-600">{occupiedCount} Beds</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Available</span>
              <span className="text-base font-bold text-emerald-600">{availableCount} Beds</span>
            </div>
          </div>

          {/* Beds List View */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {beds.map((bed) => {
              const isOccupied = (bed.status || '').toUpperCase() === 'OCCUPIED';
              const bedIdentifier = bed._id || bed.id;

              return (
                <div
                  key={bedIdentifier}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-300 ${
                    isOccupied
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  {/* Bed Icon and Identifier */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isOccupied ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      <Bed className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{bed.bedNumber}</h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                          {bedIdentifier}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isOccupied
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {bed.status}
                        </span>
                      </div>

                      {/* Patient Detail if Occupied */}
                      {isOccupied ? (
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800 truncate">{bed.patientName || 'Assigned Patient'}</span>
                          {bed.patientId && (
                            <span className="text-[10px] text-slate-500 font-mono">({bed.patientId})</span>
                          )}
                          {bed.allocatedAt && (
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              · {new Date(bed.allocatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">Vacant and ready for patient admission</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {isOccupied ? (
                      <button
                        onClick={() => setConfirmReleaseBed(bed)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs active:scale-95 cursor-pointer"
                      >
                        Release Bed
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenAllocate) onOpenAllocate(roomDisplayId);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Allocate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Bed Release */}
      {confirmReleaseBed && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmReleaseBed(null)}
          title="Confirm Patient Discharge / Bed Release"
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmReleaseBed(null)} disabled={isReleasing}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmRelease} disabled={isReleasing}>
                {isReleasing ? 'Releasing...' : 'Release Bed Space'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-semibold">Release Bed Space Confirmation</p>
                <p className="mt-1">
                  Are you sure you want to release <strong>{confirmReleaseBed.bedNumber} ({confirmReleaseBed._id || confirmReleaseBed.id})</strong> in{' '}
                  <strong>{roomDisplayName}</strong>?
                </p>
                {confirmReleaseBed.patientName && (
                  <p className="mt-1 text-amber-800">
                    Patient <strong>{confirmReleaseBed.patientName}</strong> will be discharged from this bed space.
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              The bed will immediately transition to <strong>AVAILABLE</strong> (Green) and will be selectable for new patient admissions.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ManageRoomModal;
