import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Stethoscope,
  HeartHandshake,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  RotateCcw,
  Building2,
  Filter,
  User
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../context/AppointmentContext';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import BookAppointmentModal from './BookAppointmentModal';

export const AppointmentsPage = () => {
  const { user, currentRole } = useAuth();
  const { appointments, updateAppointmentStatus, rescheduleAppointment, cancelAppointment, isSlotAvailable } = useAppointments();

  // Filter Tab State
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Reschedule Modal State
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Scoped Appointments from backend
  const scopedAppointments = appointments;

  // Filter by active tab
  const getFilteredData = () => {
    return scopedAppointments.filter((a) => {
      if (activeTab === 'TODAY') return a.date === todayStr;
      if (activeTab === 'UPCOMING') return a.date >= todayStr && a.status !== 'Completed' && a.status !== 'Cancelled' && a.status !== 'Rejected';
      if (activeTab === 'COMPLETED') return a.status === 'Completed';
      if (activeTab === 'CANCELLED') return a.status === 'Cancelled' || a.status === 'Rejected';
      return true;
    });
  };

  // Status Action Handlers
  const handleUpdateStatus = (id, newStatus, reason = '') => {
    updateAppointmentStatus(id, newStatus, reason);
  };

  const handleOpenReschedule = (appt) => {
    setRescheduleAppt(appt);
    setNewDate(appt.date);
    setNewTime(appt.time);
    setRescheduleNotes('');
    setRescheduleError('');
  };

  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    setRescheduleError('');

    if (!newDate || !newTime) {
      setRescheduleError('Please select both date and time.');
      return;
    }

    try {
      const apptId = rescheduleAppt._id || rescheduleAppt.id;
      await rescheduleAppointment(apptId, newDate, newTime, rescheduleNotes);
      setRescheduleAppt(null);
    } catch (err) {
      setRescheduleError(err.response?.data?.message || err.message || 'Failed to reschedule.');
    }
  };

  const columns = [
    {
      header: 'Appt ID',
      accessor: 'id',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-700 text-xs">{row.id}</span>
      )
    },
    {
      header: 'Patient Details',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{row.patientName}</span>
          <span className="text-[10px] text-slate-400 font-mono block">ID: {row.patientId}</span>
        </div>
      )
    },
    {
      header: 'Provider / Department',
      cell: (row) => (
        <div>
          <span className="font-medium text-slate-700 block text-xs">{row.providerName}</span>
          <span className="text-[10px] text-slate-400 block font-semibold">{row.department}</span>
        </div>
      )
    },
    {
      header: 'Type / Service',
      cell: (row) => (
        <div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              row.type === 'doctor'
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'bg-teal-50 text-teal-700 border border-teal-100'
            }`}
          >
            {row.type === 'doctor' ? (
              <>
                <Stethoscope className="w-2.5 h-2.5" /> Doctor
              </>
            ) : (
              <>
                <HeartHandshake className="w-2.5 h-2.5" /> Nurse
              </>
            )}
          </span>
          <span className="text-[10px] text-slate-600 block mt-0.5 font-medium truncate max-w-[140px]">
            {row.type === 'doctor' ? row.reason : row.service}
          </span>
        </div>
      )
    },
    {
      header: 'Date & Time',
      cell: (row) => (
        <div className="text-xs text-slate-700 font-medium flex flex-col">
          <span>📅 {row.date}</span>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5">⏰ {row.time}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <Badge>{row.status}</Badge>
    },
    {
      header: 'Actions',
      cell: (row) => {
        const apptId = row._id || row.id;
        const isProviderOrAdmin = ['doctor', 'nurse', 'admin'].includes(currentRole);

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Pending Status Actions */}
            {row.status === 'Pending' && (
              <>
                {isProviderOrAdmin ? (
                  <>
                    <Button
                      variant="white"
                      size="sm"
                      className="text-emerald-600 hover:bg-emerald-50 border-emerald-200 text-xs px-2.5"
                      onClick={() => handleUpdateStatus(apptId, 'Confirmed')}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="white"
                      size="sm"
                      className="text-amber-600 hover:bg-amber-50 border-amber-200 text-xs px-2"
                      onClick={() => handleOpenReschedule(row)}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="white"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs px-2"
                      onClick={() => handleUpdateStatus(apptId, 'Rejected', 'Declined by provider')}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="white"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs px-2"
                    onClick={() => handleUpdateStatus(apptId, 'Cancelled', 'Cancelled by patient')}
                  >
                    Cancel Request
                  </Button>
                )}
              </>
            )}

            {/* Confirmed / Rescheduled Status Actions */}
            {(row.status === 'Confirmed' || row.status === 'Rescheduled' || row.status === 'Scheduled') && (
              <>
                {isProviderOrAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs px-3"
                    onClick={() => handleUpdateStatus(apptId, 'Completed')}
                  >
                    Conclude
                  </Button>
                )}
                {isProviderOrAdmin && (
                  <Button
                    variant="white"
                    size="sm"
                    className="text-amber-600 hover:bg-amber-50 border-amber-200 text-xs px-2"
                    onClick={() => handleOpenReschedule(row)}
                  >
                    Reschedule
                  </Button>
                )}
                <Button
                  variant="white"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs px-2"
                  onClick={() => handleUpdateStatus(apptId, 'Cancelled', isProviderOrAdmin ? 'Cancelled by provider' : 'Cancelled by patient')}
                >
                  Cancel
                </Button>
              </>
            )}

            {/* Rejected Badge */}
            {row.status === 'Rejected' && (
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Rejected
              </span>
            )}

            {/* Completed Badge */}
            {row.status === 'Completed' && (
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Completed
              </span>
            )}

            {/* Cancelled Badge */}
            {row.status === 'Cancelled' && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Cancelled
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold tracking-wide uppercase">
            {currentRole === 'doctor'
              ? 'Physician Consultation Queue'
              : currentRole === 'nurse'
              ? 'Nurse Diagnostic Service Queue'
              : 'Hospital Appointment Desk'}
          </span>
          <h2 className="text-lg font-bold text-slate-800 mt-0.5">
            {currentRole === 'doctor'
              ? `${user?.name} (${user?.department || 'Cardiology'})`
              : currentRole === 'nurse'
              ? `${user?.name} (${user?.department || 'General Nursing'})`
              : 'Centralized Appointment Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'doctor' || currentRole === 'nurse'
              ? `Displaying appointments assigned specifically to your duty schedule (${scopedAppointments.length} total assigned)`
              : 'Manage patient appointments, confirm visits, and log consultation status'}
          </p>
        </div>

        {currentRole !== 'doctor' && currentRole !== 'nurse' && (
          <Button variant="primary" icon={Plus} onClick={() => setIsBookModalOpen(true)}>
            Schedule Appointment
          </Button>
        )}
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Appointments ({scopedAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'TODAY'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's ({scopedAppointments.filter((a) => a.date === todayStr).length})
          </button>
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'UPCOMING'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming ({scopedAppointments.filter((a) => a.date >= todayStr && a.status !== 'Completed' && a.status !== 'Cancelled').length})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({scopedAppointments.filter((a) => a.status === 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'CANCELLED'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled ({scopedAppointments.filter((a) => a.status === 'Cancelled').length})
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card noPadding>
        <div className="p-4">
          <Table
            columns={columns}
            data={getFilteredData()}
            searchKey="patientName"
            placeholder="Search patient by name..."
            emptyMessage={
              currentRole === 'doctor' || currentRole === 'nurse'
                ? 'No appointments found in your queue for this filter.'
                : 'No appointment records on file.'
            }
          />
        </div>
      </Card>

      {/* RESCHEDULE MODAL */}
      <Modal
        isOpen={!!rescheduleAppt}
        onClose={() => setRescheduleAppt(null)}
        title="Reschedule Appointment"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRescheduleAppt(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveReschedule}>
              Save New Schedule
            </Button>
          </div>
        }
      >
        {rescheduleAppt && (
          <form onSubmit={handleSaveReschedule} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-semibold text-slate-800">
                Patient: {rescheduleAppt.patientName} ({rescheduleAppt.patientId})
              </span>
              <p className="text-slate-500">
                Assigned Provider: {rescheduleAppt.providerName} • {rescheduleAppt.department}
              </p>
            </div>

            {rescheduleError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">New Date</label>
              <input
                type="date"
                min={todayStr}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">New Time Slot</label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm"
                required
              >
                <option value="">-- Choose Slot --</option>
                <option value="08:30 AM">08:30 AM</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="09:30 AM">09:30 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* BOOK APPOINTMENT MODAL */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
      />
    </div>
  );
};

export default AppointmentsPage;

