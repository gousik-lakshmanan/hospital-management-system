import React, { useState } from 'react';
import { UserCheck, Plus, Eye, Check } from 'lucide-react';
import { mockVisitors, mockPatients, visitorService } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const VisitorsPage = () => {
  const { currentRole } = useAuth();
  const [visitors, setVisitors] = useState(mockVisitors);
  const [patients, setPatients] = useState(mockPatients);

  // Modal Form
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [visName, setVisName] = useState('');
  const [visPhone, setVisPhone] = useState('');
  const [visPatient, setVisPatient] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    if (!visName || !visPhone || !visPatient) return;

    visitorService.create({
      visitorName: visName,
      phone: visPhone,
      patientName: visPatient
    });

    setVisitors([...mockVisitors]);
    setIsPassOpen(false);

    setVisName('');
    setVisPhone('');
    setVisPatient('');
  };

  const handleCheckOut = (id) => {
    visitorService.checkOut(id);
    setVisitors([...mockVisitors]);
  };

  const columns = [
    { header: 'Pass ID', accessor: 'passId', cell: (row) => <span className="font-semibold">{row.passId}</span> },
    { header: 'Visitor Name', accessor: 'visitorName', cell: (row) => <span className="font-semibold text-slate-800">{row.visitorName}</span> },
    { header: 'Phone Number', accessor: 'phone', cell: (row) => <span className="text-slate-500">{row.phone}</span> },
    { header: 'Visiting Patient', accessor: 'patientName', cell: (row) => <span className="font-semibold text-slate-600">{row.patientName}</span> },
    { header: 'Check In Time', accessor: 'checkInTime', cell: (row) => <span className="text-xs text-slate-400">{row.checkInTime}</span> },
    { header: 'Check Out Time', accessor: 'checkOutTime', cell: (row) => <span className="text-xs text-slate-400">{row.checkOutTime || 'Active'}</span> },
    { header: 'Status', accessor: 'status', cell: (row) => <Badge>{row.status}</Badge> },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center">
          {row.status === 'Checked In' && (currentRole === 'admin' || currentRole === 'receptionist') && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-slate-200 hover:bg-red-50"
              onClick={() => handleCheckOut(row.id)}
            >
              Check Out
            </Button>
          )}
          {row.status === 'Checked Out' && (
            <span className="text-[10px] font-semibold text-slate-400">Archived</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Visitor Gate Passes Log</h2>
          <p className="text-xs text-slate-500">Log checking-in relative passes, visitor histories, and statuses</p>
        </div>
        {(currentRole === 'admin' || currentRole === 'receptionist') && (
          <Button variant="primary" icon={Plus} onClick={() => setIsPassOpen(true)}>
            Register Visitor Intake
          </Button>
        )}
      </div>

      <Card noPadding>
        <div className="p-4">
          <Table
            columns={columns}
            data={visitors}
            searchKey="visitorName"
            placeholder="Search visitor by name..."
            emptyMessage="No gate visitor logs recorded."
          />
        </div>
      </Card>

      {/* Issue Pass Modal */}
      <Modal
        isOpen={isPassOpen}
        onClose={() => setIsPassOpen(false)}
        title="Issue Gate Visitor Pass"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPassOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRegister}>Generate Pass</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Visitor Full Name</label>
            <input
              type="text"
              value={visName}
              onChange={(e) => setVisName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
            <input
              type="text"
              value={visPhone}
              onChange={(e) => setVisPhone(e.target.value)}
              placeholder="e.g. +91 98888 12345"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Visiting Admitted Patient</label>
            <select
              value={visPatient}
              onChange={(e) => setVisPatient(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.filter(p => p.status !== 'Outpatient').map(p => (
                <option key={p.id} value={p.name}>{p.name} ({p.room})</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VisitorsPage;
