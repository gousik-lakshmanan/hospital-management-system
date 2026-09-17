import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, CheckCircle, LogOut, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useVisitors } from '../../context/VisitorContext';
import { patientService } from '../../services/api';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const VisitorsPage = () => {
  const { currentRole } = useAuth();
  const { visitors, loading, createVisitor, checkInVisitor, checkOutVisitor, cancelVisitor } = useVisitors();

  const [patients, setPatients] = useState([]);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [visName, setVisName] = useState('');
  const [visPhone, setVisPhone] = useState('');
  const [visEmail, setVisEmail] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [purpose, setPurpose] = useState('General Visit');
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await patientService.getPatients();
        if (res.success && Array.isArray(res.data)) {
          setPatients(res.data);
        } else if (res.success && Array.isArray(res.patients)) {
          setPatients(res.patients);
        }
      } catch (err) {
        console.warn('Failed to fetch patients list for visitors:', err);
      }
    };
    if (currentRole === 'admin' || currentRole === 'receptionist') {
      fetchPatients();
    }
  }, [currentRole]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!visName.trim() || !visPhone.trim() || !patientId) return;

    try {
      setSubmitting(true);
      const selectedPat = patients.find(p => (p._id || p.id) === patientId);
      await createVisitor({
        visitorName: visName.trim(),
        phone: visPhone.trim(),
        email: visEmail.trim(),
        relationship: relationship.trim(),
        purpose: purpose.trim(),
        patientId,
        patientRoom: selectedPat?.room || selectedPat?.ward || 'Unassigned',
        notes: notes.trim()
      });

      setIsPassOpen(false);
      setVisName('');
      setVisPhone('');
      setVisEmail('');
      setRelationship('Family');
      setPurpose('General Visit');
      setPatientId('');
      setNotes('');
    } catch (err) {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Checked In': return 'success';
      case 'Expected': return 'warning';
      case 'Checked Out': return 'default';
      case 'Cancelled': return 'danger';
      default: return 'default';
    }
  };

  const canMutate = currentRole === 'admin' || currentRole === 'receptionist';

  const columns = [
    {
      header: 'Pass ID',
      accessor: 'passId',
      cell: (row) => <span className="font-bold text-blue-600 font-mono text-xs">{row.passId}</span>
    },
    {
      header: 'Visitor Name',
      accessor: 'visitorName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{row.visitorName}</span>
          <span className="text-[10px] text-slate-400 capitalize">{row.relationship || 'Visitor'}</span>
        </div>
      )
    },
    {
      header: 'Phone / Email',
      cell: (row) => (
        <div className="text-xs">
          <span className="text-slate-600 block">{row.phone}</span>
          {row.email && <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{row.email}</span>}
        </div>
      )
    },
    {
      header: 'Visiting Patient',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-700 text-xs block">{row.patientName}</span>
          <span className="text-[10px] text-slate-400">Ward: {row.patientRoom || 'Unassigned'}</span>
        </div>
      )
    },
    {
      header: 'Check In',
      cell: (row) => <span className="text-xs text-slate-500 font-mono">{formatDateTime(row.checkInTime)}</span>
    },
    {
      header: 'Check Out',
      cell: (row) => <span className="text-xs text-slate-500 font-mono">{formatDateTime(row.checkOutTime)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {canMutate && row.status === 'Expected' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                className="text-xs py-1 px-2.5"
                onClick={() => checkInVisitor(row._id || row.id)}
              >
                Check In
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs py-1 px-2 text-rose-600 border-slate-200 hover:bg-rose-50"
                onClick={() => cancelVisitor(row._id || row.id)}
              >
                Cancel
              </Button>
            </>
          )}
          {canMutate && row.status === 'Checked In' && (
            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              className="text-xs py-1 px-2.5 text-amber-700 border-amber-200 hover:bg-amber-50"
              onClick={() => checkOutVisitor(row._id || row.id)}
            >
              Check Out
            </Button>
          )}
          {row.status === 'Checked Out' && (
            <span className="text-[10px] font-semibold text-slate-400">Archived</span>
          )}
          {row.status === 'Cancelled' && (
            <span className="text-[10px] font-semibold text-rose-400">Cancelled</span>
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
          <p className="text-xs text-slate-500">Log and manage check-in relative passes, visitor histories, and statuses</p>
        </div>
        {canMutate && (
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
            placeholder="Search visitor by name or pass ID..."
            emptyMessage={loading ? "Loading visitor records..." : "No gate visitor logs recorded."}
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
            <Button variant="primary" loading={submitting} onClick={handleRegister}>Generate Pass</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Visitor Full Name *</label>
            <input
              type="text"
              value={visName}
              onChange={(e) => setVisName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone Number *</label>
              <input
                type="text"
                value={visPhone}
                onChange={(e) => setVisPhone(e.target.value)}
                placeholder="e.g. +91 98888 12345"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address (Optional)</label>
              <input
                type="email"
                value={visEmail}
                onChange={(e) => setVisEmail(e.target.value)}
                placeholder="visitor@example.com"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Relationship *</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              >
                <option value="Family">Family</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Purpose of Visit</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Ward Visit & Care"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Visiting Admitted Patient *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              required
            >
              <option value="">-- Choose Admitted Patient --</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.room ? `(${p.room})` : ''} - ID: {p.patientId || p._id.slice(-6)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Visitor Notes / Gate Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Escort badge issued, visiting post-surgery ward"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VisitorsPage;

