import React, { useState } from 'react';
import { Droplet, Plus, Heart, HelpCircle, ShieldAlert, Sliders, Send, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBloodBank } from '../../context/BloodBankContext';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import ManageBloodStockModal from './ManageBloodStockModal';
import BloodRequestModal from './BloodRequestModal';
import BloodRequestSuccessModal from './BloodRequestSuccessModal';
import AdminBloodRequestModal from './AdminBloodRequestModal';
import BloodRequestStatusBadge from './BloodRequestStatusBadge';

export const BloodBankPage = () => {
  const { currentRole, user } = useAuth();
  const { stock, donors, bloodRequests, addDonor } = useBloodBank();

  // Modals
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isManageStockModalOpen, setIsManageStockModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);

  // Admin Request Action Modal State
  const [adminActionModal, setAdminActionModal] = useState({
    isOpen: false,
    request: null,
    actionType: 'approve' // 'approve' | 'negotiate' | 'reject'
  });

  // Donor Form
  const [donorName, setDonorName] = useState('');
  const [donorGroup, setDonorGroup] = useState('O+');
  const [donorPhone, setDonorPhone] = useState('');

  const handleAddDonor = (e) => {
    e.preventDefault();
    if (currentRole !== 'admin') {
      console.warn('Frontend action-level authorization error: Only administrators can register blood donors.');
      return;
    }
    if (!donorName || !donorPhone) return;

    addDonor({
      name: donorName,
      bloodGroup: donorGroup,
      phone: donorPhone
    });

    setIsDonorModalOpen(false);
    setDonorName('');
    setDonorPhone('');
  };

  const handleOpenAdminAction = (request, actionType) => {
    setAdminActionModal({
      isOpen: true,
      request,
      actionType
    });
  };

  const handleCloseAdminAction = () => {
    setAdminActionModal({
      isOpen: false,
      request: null,
      actionType: 'approve'
    });
  };

  // Filter requests for requester view (Doctor, Nurse, Receptionist, Patient)
  const myRequests = bloodRequests.filter(
    (r) => r.requesterId === user?.id || (user?.email && r.requesterId === user?.email)
  );

  const donorColumns = [
    { header: 'Donor ID', accessor: 'id', cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: 'Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Blood Group', accessor: 'bloodGroup', cell: (row) => <span className="font-bold text-rose-600">{row.bloodGroup}</span> },
    { header: 'Contact', accessor: 'phone', cell: (row) => <span className="text-slate-500">{row.phone}</span> },
    { header: 'Last Donated', accessor: 'lastDonated', cell: (row) => <span className="text-slate-400">{row.lastDonated}</span> }
  ];

  // Columns for Requester History
  const myRequestColumns = [
    {
      header: 'Request ID',
      accessor: 'id',
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.id}</span>
    },
    {
      header: 'Blood Group',
      accessor: 'bloodGroup',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 font-bold text-rose-600">
          <Droplet className="w-3.5 h-3.5 fill-rose-600" />
          {row.bloodGroup}
        </span>
      )
    },
    {
      header: 'Requested',
      accessor: 'requestedUnits',
      cell: (row) => <span className="font-semibold text-slate-800">{row.requestedUnits} Units</span>
    },
    {
      header: 'Approved',
      accessor: 'approvedUnits',
      cell: (row) => (
        <span className="font-semibold text-slate-700">
          {row.status === 'pending' ? '—' : `${row.approvedUnits} Units`}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <BloodRequestStatusBadge status={row.status} />
    },
    {
      header: 'Submitted On',
      accessor: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
        </span>
      )
    }
  ];

  // Columns for Admin Request Management
  const adminRequestColumns = [
    {
      header: 'Request ID',
      accessor: 'id',
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.id}</span>
    },
    {
      header: 'Requester',
      accessor: 'requesterName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{row.requesterName}</span>
          <span className="text-[10px] text-slate-400 capitalize font-medium">{row.requesterRole}</span>
        </div>
      )
    },
    {
      header: 'Blood Group',
      accessor: 'bloodGroup',
      cell: (row) => (
        <span className="inline-flex items-center gap-1 font-bold text-rose-600">
          <Droplet className="w-3.5 h-3.5 fill-rose-600" />
          {row.bloodGroup}
        </span>
      )
    },
    {
      header: 'Requested Units',
      accessor: 'requestedUnits',
      cell: (row) => <span className="font-semibold text-slate-800">{row.requestedUnits} Bags</span>
    },
    {
      header: 'Approved Units',
      accessor: 'approvedUnits',
      cell: (row) => (
        <span className="font-semibold text-slate-700">
          {row.status === 'pending' ? '—' : `${row.approvedUnits} Bags`}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <BloodRequestStatusBadge status={row.status} />
    },
    {
      header: 'Date & Time',
      accessor: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
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
              onClick={() => handleOpenAdminAction(row, 'approve')}
              className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              title="Approve requested quantity"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleOpenAdminAction(row, 'negotiate')}
              className="px-2 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              title="Negotiate approved quantity"
            >
              Negotiate
            </button>
            <button
              type="button"
              onClick={() => handleOpenAdminAction(row, 'reject')}
              className="px-2 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              title="Reject request"
            >
              Reject
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Blood Bank Repository</h2>
          <p className="text-xs text-slate-500">Monitor blood inventory, blood requests, and donor logs</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Actions */}
          {currentRole === 'admin' && (
            <>
              <Button
                variant="primary"
                icon={Sliders}
                onClick={() => setIsManageStockModalOpen(true)}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-sm shadow-red-500/20 text-xs"
              >
                Manage Bag Counts
              </Button>
              <Button
                variant="outline"
                icon={Plus}
                onClick={() => setIsDonorModalOpen(true)}
                className="text-xs"
              >
                Register Blood Donor
              </Button>
            </>
          )}

          {/* Doctor, Nurse, Receptionist, Patient: Request Blood Units Button */}
          {currentRole !== 'admin' && (
            <Button
              variant="primary"
              icon={Send}
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0 shadow-md shadow-rose-500/20 text-xs"
            >
              Request Blood Units
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Blood Stocks */}
      <Card title="Current Blood Stock Count (Bags)" subtitle="Real-time stock indicators per blood group">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {stock.map((s) => (
            <div
              key={s.group}
              className={`p-4 border rounded-xl flex flex-col items-center justify-center text-center shadow-xs transition-all duration-200 ${
                s.status === 'Emergency Alert' ? 'bg-red-50 border-red-200 text-red-700' :
                s.status === 'Low Stock' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-slate-50/50 border-slate-200 text-slate-700'
              }`}
            >
              <Droplet className={`w-6 h-6 mb-1 ${s.status === 'Emergency Alert' ? 'text-red-600 fill-red-600' : 'text-rose-500 fill-rose-500'}`} />
              <span className="text-base font-extrabold block">{s.group}</span>
              <span className="text-xs font-bold block mt-1">{s.bags} Bags</span>
              <span className="text-[8px] font-bold block mt-1 uppercase tracking-wider text-slate-400">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Admin Blood Unit Requests Section */}
      {currentRole === 'admin' && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <span>Blood Unit Requests</span>
              {bloodRequests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {bloodRequests.filter((r) => r.status === 'pending').length} Pending
                </span>
              )}
            </div>
          }
          subtitle="Manage blood unit requests from doctors, nurses, receptionists, and patients"
        >
          <Table
            columns={adminRequestColumns}
            data={bloodRequests}
            searchKey="requesterName"
            placeholder="Search requester name..."
            emptyMessage="No blood unit requests found."
          />
        </Card>
      )}

      {/* Non-Admin "My Blood Requests" Section */}
      {currentRole !== 'admin' && (
        <Card
          title="My Blood Requests"
          subtitle="Track the authorization status of your submitted blood unit requests"
        >
          <Table
            columns={myRequestColumns}
            data={myRequests}
            searchKey="bloodGroup"
            placeholder="Search blood group..."
            emptyMessage="You have not submitted any blood requests yet. Click 'Request Blood Units' to create one."
          />
        </Card>
      )}

      {/* Donors list (Visible to Admin, Doctor, Nurse, Receptionist) */}
      {currentRole !== 'patient' && (
        <Card title="Hospital Blood Donors Log" subtitle="List of registered blood bank donors">
          <Table
            columns={donorColumns}
            data={donors}
            searchKey="name"
            placeholder="Search donor name..."
            emptyMessage="No blood donors found."
          />
        </Card>
      )}

      {/* Request Blood Units Modal (For Non-Admin) */}
      {currentRole !== 'admin' && (
        <BloodRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={(req) => setSuccessModalData(req)}
        />
      )}

      {/* Request Success Modal */}
      <BloodRequestSuccessModal
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        requestDetails={successModalData}
      />

      {/* Admin Manage Blood Stock Modal */}
      {currentRole === 'admin' && (
        <ManageBloodStockModal
          isOpen={isManageStockModalOpen}
          onClose={() => setIsManageStockModalOpen(false)}
        />
      )}

      {/* Admin Request Action Modal (Approve / Negotiate / Reject) */}
      {currentRole === 'admin' && (
        <AdminBloodRequestModal
          isOpen={adminActionModal.isOpen}
          onClose={handleCloseAdminAction}
          request={adminActionModal.request}
          actionType={adminActionModal.actionType}
        />
      )}

      {/* Register Donor Modal (Admin Only) */}
      {currentRole === 'admin' && (
        <Modal
          isOpen={isDonorModalOpen}
          onClose={() => setIsDonorModalOpen(false)}
          title="Register New Blood Donor"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDonorModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddDonor}>Register Donor</Button>
            </div>
          }
        >
          <form className="space-y-4" onSubmit={handleAddDonor}>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Donor Full Name</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g. Anand Kumar"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Blood Group</label>
                <select
                  value={donorGroup}
                  onChange={(e) => setDonorGroup(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="e.g. +91 94444 88888"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                  required
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BloodBankPage;
