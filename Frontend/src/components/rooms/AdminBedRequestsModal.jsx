import React, { useState } from 'react';
import { Bed, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, Inbox } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Table from '../common/Table';
import BedRequestStatusBadge from './BedRequestStatusBadge';
import { useRooms } from '../../context/RoomContext';

export const AdminBedRequestsModal = ({ isOpen, onClose, onOpenAccept }) => {
  const { rooms, bedRequests, rejectBedRequest } = useRooms();

  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [isProcessingReject, setIsProcessingReject] = useState(false);

  // Sort requests: Pending first, then newest first
  const sortedRequests = [...bedRequests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.requestedAt || b.createdAt || 0) - new Date(a.requestedAt || a.createdAt || 0);
  });

  const pendingCount = bedRequests.filter((r) => r.status === 'pending').length;

  const handleConfirmReject = async () => {
    if (!rejectingRequest || isProcessingReject) return;

    setIsProcessingReject(true);
    const requestId = rejectingRequest.id || rejectingRequest._id;
    await rejectBedRequest(requestId);
    setIsProcessingReject(false);
    setRejectingRequest(null);
  };

  const columns = [
    {
      header: 'Patient',
      accessor: 'requesterName',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-800 block text-xs">{row.requesterName}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.requesterId}</span>
        </div>
      )
    },
    {
      header: 'Requested Section',
      accessor: 'sectionName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{row.sectionName}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.sectionId}</span>
        </div>
      )
    },
    {
      header: 'Section Vacancy',
      accessor: 'sectionId',
      cell: (row) => {
        const sec = rooms.find((r) => (r.roomNumber || r.roomId) === row.sectionId);
        const avail = sec
          ? (sec.beds || []).filter((b) => (b.status || '').toUpperCase() === 'AVAILABLE').length
          : 0;
        return (
          <span
            className={`font-semibold text-xs px-2 py-0.5 rounded ${
              avail > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {avail} Vacant
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <div>
          <BedRequestStatusBadge status={row.status} />
          {row.status === 'approved' && row.assignedBedNumber && (
            <span className="block text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
              Bed: {row.assignedBedNumber}
            </span>
          )}
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
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => {
        if (row.status !== 'pending') {
          return <span className="text-[11px] text-slate-400 font-medium">Resolved</span>;
        }

        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenAccept(row)}
              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => setRejectingRequest(row)}
              className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              Reject
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <>
      <Modal
        isOpen={isOpen && !rejectingRequest}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-800">Patient Bed Requests</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <span className="block text-[11px] font-normal text-slate-500">
                Review and allocate bed spaces requested by patients
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <Table
            columns={columns}
            data={sortedRequests}
            searchKey="requesterName"
            placeholder="Search patient name..."
            emptyMessage="No bed requests submitted yet."
          />
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      {rejectingRequest && (
        <Modal
          isOpen={!!rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-800">Reject Bed Request</span>
                <span className="block text-[11px] font-normal text-slate-500">
                  Request ID: {rejectingRequest.id || rejectingRequest._id}
                </span>
              </div>
            </div>
          }
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setRejectingRequest(null)}
                className="text-xs"
                disabled={isProcessingReject}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={XCircle}
                onClick={handleConfirmReject}
                disabled={isProcessingReject}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isProcessingReject ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
              <p className="font-bold">Are you sure you want to reject this bed request?</p>
              <div className="space-y-1 text-rose-800">
                <p>
                  <strong>Patient:</strong> {rejectingRequest.requesterName} ({rejectingRequest.requesterId})
                </p>
                <p>
                  <strong>Requested Section:</strong> {rejectingRequest.sectionName} ({rejectingRequest.sectionId})
                </p>
              </div>
              <p className="text-[11px] text-rose-700 pt-1">
                Rejecting marks the request as Rejected. Room and bed availability will remain unchanged.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AdminBedRequestsModal;
