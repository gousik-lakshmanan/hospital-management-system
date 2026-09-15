import React, { useState } from 'react';
import { Bed, Plus, Settings, Eye, CheckCircle2, ShieldAlert, Sparkles, Inbox, ClipboardList, Send } from 'lucide-react';
import { useRooms } from '../../context/RoomContext';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import AllocateBedModal from './AllocateBedModal';
import ManageRoomModal from './ManageRoomModal';
import BedRequestModal from './BedRequestModal';
import BedRequestSuccessModal from './BedRequestSuccessModal';
import AdminBedRequestsModal from './AdminBedRequestsModal';
import AcceptBedRequestModal from './AcceptBedRequestModal';
import BedRequestStatusBadge from './BedRequestStatusBadge';

export const RoomsPage = () => {
  const { currentRole, user } = useAuth();
  const { rooms, totalRooms, totalBeds, occupiedBeds, availableBeds, bedRequests } = useRooms();

  const isAdmin = currentRole === 'admin';
  const isPatient = currentRole === 'patient';

  // Allocation Modal State (Admin)
  const [isAllocOpen, setIsAllocOpen] = useState(false);
  const [allocInitialRoom, setAllocInitialRoom] = useState('');

  // Manage Modal State (Admin)
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageRoomNumber, setManageRoomNumber] = useState('');

  // Patient Bed Request Modals State
  const [isPatientRequestOpen, setIsPatientRequestOpen] = useState(false);
  const [patientSuccessData, setPatientSuccessData] = useState(null);

  // Admin View Requests Modals State
  const [isAdminRequestsOpen, setIsAdminRequestsOpen] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState(null);

  const pendingRequestsCount = bedRequests.filter((r) => r.status === 'pending').length;

  // Filter requests for patient view
  const myBedRequests = bedRequests.filter(
    (r) => r.requesterId === user?.id || (user?.email && r.requesterId === user?.email)
  );

  const handleOpenAllocate = (roomNumber = '') => {
    if (!isAdmin) return;
    setAllocInitialRoom(roomNumber);
    setIsAllocOpen(true);
  };

  const handleOpenManage = (roomNumber) => {
    if (!isAdmin) return;
    setManageRoomNumber(roomNumber);
    setIsManageOpen(true);
  };

  const handleOpenAcceptFromList = (request) => {
    setIsAdminRequestsOpen(false);
    setAcceptingRequest(request);
  };

  const myBedRequestColumns = [
    {
      header: 'Requested Section',
      accessor: 'sectionName',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-800 block text-xs">{row.sectionName}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.sectionId}</span>
        </div>
      )
    },
    {
      header: 'Requested At',
      accessor: 'requestedAt',
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.requestedAt ? new Date(row.requestedAt).toLocaleString() : '—'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <BedRequestStatusBadge status={row.status} />
    },
    {
      header: 'Assigned Bed',
      accessor: 'assignedBedNumber',
      cell: (row) => {
        if (row.status === 'approved' && row.assignedBedNumber) {
          return (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
              <Bed className="w-3.5 h-3.5 text-emerald-600" />
              {row.assignedBedNumber}
            </span>
          );
        }
        return <span className="text-xs text-slate-400 font-medium">Not assigned</span>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Rooms & Bed Management</h2>
            {!isAdmin && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider border border-slate-200">
                <Eye className="w-3 h-3 mr-1 text-slate-400" /> Read-Only View
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of critical ICU, Emergency, and Ward room resources
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Admin Actions */}
          {isAdmin && (
            <>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => handleOpenAllocate('')}
              >
                Allocate Bed Space
              </Button>
              <Button
                variant="outline"
                icon={Inbox}
                onClick={() => setIsAdminRequestsOpen(true)}
                className="relative"
              >
                <span>View Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                    {pendingRequestsCount}
                  </span>
                )}
              </Button>
            </>
          )}

          {/* Patient Action */}
          {isPatient && (
            <Button
              variant="primary"
              icon={Bed}
              onClick={() => setIsPatientRequestOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
            >
              Request a Bed
            </Button>
          )}
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Room Units */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs transition-all hover:shadow-sm">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Total Room Units
          </span>
          <span className="text-2xl font-extrabold text-slate-800 block mt-1">
            {totalRooms} Units
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Ward, Emergency, ICU, Suites
          </span>
        </div>

        {/* Total Bed Spaces */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs transition-all hover:shadow-sm">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Total Bed Spaces
          </span>
          <span className="text-2xl font-extrabold text-slate-800 block mt-1">
            {totalBeds} Total
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            6 Room/Unit sections
          </span>
        </div>

        {/* Occupied Beds */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs transition-all hover:shadow-sm">
          <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">
            Occupied Beds
          </span>
          <span className="text-2xl font-extrabold text-rose-600 block mt-1">
            {occupiedBeds} Occupied
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            {Math.round((occupiedBeds / (totalBeds || 1)) * 100)}% hospital occupancy
          </span>
        </div>

        {/* Free Bed Spaces */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs transition-all hover:shadow-sm">
          <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
            Free Bed Spaces
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 block mt-1">
            {availableBeds} Available
          </span>
          <span className="text-[11px] text-emerald-700/80 font-medium block mt-1">
            Ready for admission
          </span>
        </div>
      </div>

      {/* Visual Room Sections (Ward A, Emergency, ICU, Private Suite 1, 2, 3) */}
      <div className="space-y-6">
        {rooms.map((room) => {
          const roomBeds = room.beds || [];
          const occupiedCount = roomBeds.filter(b => (b.status || '').toUpperCase() === 'OCCUPIED').length;
          const availableCount = roomBeds.filter(b => (b.status || '').toUpperCase() === 'AVAILABLE').length;
          const isFull = availableCount === 0;

          return (
            <Card
              key={room.roomNumber}
              className="border border-slate-200/90 shadow-xs"
              title={
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-800">
                    {room.type} ({room.roomNumber})
                  </span>
                  {isFull ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider">
                      FULL
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                      {availableCount} VACANT
                    </span>
                  )}
                </div>
              }
              subtitle={
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span>{room.totalBeds} Bed Space{room.totalBeds > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span className="text-rose-600 font-semibold">{occupiedCount} Occupied</span>
                  <span>·</span>
                  <span className="text-emerald-600 font-semibold">{availableCount} Available</span>
                </div>
              }
              action={
                isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Settings}
                      onClick={() => handleOpenManage(room.roomNumber)}
                    >
                      Manage
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      disabled={isFull}
                      onClick={() => handleOpenAllocate(room.roomNumber)}
                    >
                      Allocate Bed
                    </Button>
                  </div>
                ) : null
              }
            >
              {/* Bed Spaces Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {roomBeds.map((bed) => {
                  const isOccupied = (bed.status || '').toUpperCase() === 'OCCUPIED';

                  return (
                    <div
                      key={bed.id}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center shadow-xs transition-all duration-500 ease-in-out ${
                        isOccupied
                          ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                          : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      }`}
                    >
                      {/* Bed Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-colors duration-500 ${
                          isOccupied
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        <Bed className="w-5 h-5" />
                      </div>

                      {/* Bed Number */}
                      <span className="text-xs font-bold text-slate-800">{bed.bedNumber}</span>

                      {/* Bed Unique ID */}
                      <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {bed.id}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 transition-all duration-500 ${
                          isOccupied
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {bed.status}
                      </span>

                      {/* Occupied Patient Detail */}
                      {isOccupied && bed.patientName ? (
                        <div className="mt-1 w-full" title={bed.patientName}>
                          <span className="text-[10px] font-semibold text-slate-700 truncate block max-w-full">
                            {bed.patientName}
                          </span>
                          {bed.patientId && (
                            <span className="text-[9px] font-mono text-slate-400 block">
                              {bed.patientId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-emerald-700/70 font-medium mt-1 block">
                          Vacant
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Patient "My Bed Requests" Section */}
      {isPatient && (
        <Card
          title="My Bed Requests"
          subtitle="Track the allocation status of your submitted room section bed requests"
        >
          <Table
            columns={myBedRequestColumns}
            data={myBedRequests}
            searchKey="sectionName"
            placeholder="Search section name..."
            emptyMessage="You have not requested a bed yet. Click 'Request a Bed' above to request a bed space."
          />
        </Card>
      )}

      {/* Patient Request a Bed Modal */}
      {isPatient && (
        <BedRequestModal
          isOpen={isPatientRequestOpen}
          onClose={() => setIsPatientRequestOpen(false)}
          onSuccess={(req) => setPatientSuccessData(req)}
        />
      )}

      {/* Patient Request Success Modal */}
      {isPatient && (
        <BedRequestSuccessModal
          isOpen={!!patientSuccessData}
          onClose={() => setPatientSuccessData(null)}
          requestDetails={patientSuccessData}
        />
      )}

      {/* Admin View Requests Modal */}
      {isAdmin && (
        <AdminBedRequestsModal
          isOpen={isAdminRequestsOpen}
          onClose={() => setIsAdminRequestsOpen(false)}
          onOpenAccept={handleOpenAcceptFromList}
        />
      )}

      {/* Admin Accept Bed Request Modal */}
      {isAdmin && (
        <AcceptBedRequestModal
          isOpen={!!acceptingRequest}
          onClose={() => setAcceptingRequest(null)}
          request={acceptingRequest}
          onSuccess={() => {
            setAcceptingRequest(null);
          }}
        />
      )}

      {/* Allocate Bed Modal (Admin Only) */}
      {isAdmin && (
        <AllocateBedModal
          isOpen={isAllocOpen}
          onClose={() => setIsAllocOpen(false)}
          initialRoomNumber={allocInitialRoom}
        />
      )}

      {/* Manage Room Modal (Admin Only) */}
      {isAdmin && manageRoomNumber && (
        <ManageRoomModal
          isOpen={isManageOpen}
          onClose={() => {
            setIsManageOpen(false);
            setManageRoomNumber('');
          }}
          roomNumber={manageRoomNumber}
          onOpenAllocate={(roomNum) => {
            setAllocInitialRoom(roomNum);
            setIsAllocOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default RoomsPage;
