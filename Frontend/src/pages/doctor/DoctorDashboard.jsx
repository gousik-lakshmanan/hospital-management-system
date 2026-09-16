import React, { useState } from 'react';
import { Calendar, Users, ClipboardList, CheckSquare, AlertCircle, Plus, Eye, Stethoscope, Pill, Check, Clock, X, RotateCcw, CheckCircle2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { mockPatients, patientService } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../context/AppointmentContext';
import { usePharmacy } from '../../context/PharmacyContext';
import { usePrescriptions } from '../../context/PrescriptionContext';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { appointments, updateAppointmentStatus, rescheduleAppointment, isSlotAvailable, refreshAppointments } = useAppointments();
  const { medicines } = usePharmacy();
  const { createPrescription } = usePrescriptions();
  
  // Scoped appointments from backend for logged-in doctor
  const doctorAppointments = appointments.filter((a) => a.type === 'doctor');
  const pendingRequests = doctorAppointments.filter((a) => a.status === 'Pending');
  const activeQueue = doctorAppointments.filter((a) => a.status === 'Confirmed' || a.status === 'Rescheduled');

  const [patients, setPatients] = useState(mockPatients);
  
  // Consultation form states
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescMed, setPrescMed] = useState('');
  const [prescDosage, setPrescDosage] = useState('1-0-1');
  const [prescDuration, setPrescDuration] = useState('7 days');
  
  // Reschedule Modal state
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const stats = [
    { label: "Today's Consultations", value: doctorAppointments.length.toString(), icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Requests', value: pendingRequests.length.toString(), icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
    { label: 'Confirmed in Queue', value: activeQueue.length.toString(), icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Completed Consultations', value: doctorAppointments.filter(a => a.status === 'Completed').length.toString(), icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Patient Alerts', value: '1 critical', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' }
  ];

  const handleOpenConsult = (patientId) => {
    setSelectedPatientId(patientId);
    setIsConsultModalOpen(true);
  };

  const handleSaveConsult = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedPatientId || !diagnosis) return;

    // Create prescription in MongoDB if medication is provided
    if (prescMed) {
      let matchedMed = medicines.find(
        (m) => m._id === prescMed || m.name.toLowerCase() === prescMed.toLowerCase()
      );
      if (!matchedMed && medicines.length > 0) {
        matchedMed = medicines[0];
      }

      if (matchedMed) {
        await createPrescription({
          patientId: selectedPatientId,
          medicines: [
            {
              medicineId: matchedMed._id || matchedMed.id,
              medicineName: matchedMed.name,
              dosage: prescDosage || '1-0-1',
              duration: prescDuration || '7 days',
              quantity: 1,
            },
          ],
          diagnosis,
        });
      }
    }

    const app = doctorAppointments.find((a) => a.patientId === selectedPatientId || a.patient?._id === selectedPatientId);
    if (app) {
      await updateAppointmentStatus(app._id || app.id, 'Completed', diagnosis);
    }
    
    setDiagnosis('');
    setPrescMed('');
    setSelectedPatientId('');
    setIsConsultModalOpen(false);
  };

  const handleViewPatientDetails = (pat) => {
    setSelectedPatientDetails(pat);
    setIsDetailsModalOpen(true);
  };

  const handleAcceptRequest = async (app) => {
    setActionLoadingId(app._id || app.id);
    try {
      await updateAppointmentStatus(app._id || app.id, 'Confirmed');
    } catch (err) {
      console.error('Accept error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (app) => {
    setActionLoadingId(app._id || app.id);
    try {
      await updateAppointmentStatus(app._id || app.id, 'Rejected', 'Declined by physician');
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReschedule = (app) => {
    setRescheduleModalAppt(app);
    setRescheduleDate(app.date);
    setRescheduleTime(app.time);
    setRescheduleNotes('');
    setRescheduleError('');
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Please select both date and time.');
      return;
    }

    try {
      await rescheduleAppointment(
        rescheduleModalAppt._id || rescheduleModalAppt.id,
        rescheduleDate,
        rescheduleTime,
        rescheduleNotes
      );
      setRescheduleModalAppt(null);
    } catch (err) {
      setRescheduleError(err.response?.data?.message || err.message || 'Failed to reschedule.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold tracking-wide uppercase">Practice Overview</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Welcome back, {user?.name || 'Dr. Arun Kumar'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.department || 'Cardiology'} Department Office | {pendingRequests.length} pending appointment requests awaiting your review
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" icon={Plus} onClick={() => handleOpenConsult('')}>
            New Consult Log
          </Button>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
            <div className={`p-2.5 rounded-lg shrink-0 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{stat.label}</span>
              <span className="text-base font-bold text-slate-800 block mt-0.5">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* APPOINTMENT REQUESTS WIDGET (CRITICAL STAGE 3 REQUIREMENT) */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-600" />
              <span>APPOINTMENT REQUESTS</span>
            </div>
            {pendingRequests.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                {pendingRequests.length} Pending Review
              </span>
            )}
          </div>
        }
        subtitle="Incoming patient consultation requests requiring your confirmation, rejection, or rescheduling"
      >
        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-1" />
            <span className="font-semibold text-slate-600">No pending appointment requests</span>
            <span>All incoming consultation requests have been addressed.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingRequests.map((app) => (
              <div key={app._id || app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {app.patientName?.split(' ').map((n) => n[0]).join('') || 'PT'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs text-slate-800">{app.patientName}</h4>
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                        Pending Request
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                      <span>Department: <strong>{app.department}</strong></span>
                      <span>•</span>
                      <span>📅 {app.date}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-semibold">⏰ {app.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 italic">
                      "{app.reason || 'Clinical Consultation'}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2.5"
                    loading={actionLoadingId === (app._id || app.id)}
                    onClick={() => handleAcceptRequest(app)}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="white"
                    size="sm"
                    className="text-amber-700 hover:bg-amber-50 border-amber-200 text-xs px-2"
                    onClick={() => handleOpenReschedule(app)}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="white"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs px-2"
                    loading={actionLoadingId === (app._id || app.id)}
                    onClick={() => handleRejectRequest(app)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Today's Consultation Queue" subtitle="Confirmed patient appointments in queue">
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {activeQueue.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No confirmed consultations scheduled in queue
                </div>
              ) : (
                activeQueue.map((app) => {
                  const patient = patients.find((p) => p.id === app.patientId);
                  return (
                    <div key={app._id || app.id} className="py-3.5 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                          {app.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800">{app.patientName}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>📅 {app.date}</span>
                            <span>•</span>
                            <span className="text-blue-600 font-semibold">{app.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{app.status}</Badge>
                        {app.status !== 'Completed' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Stethoscope}
                            onClick={() => handleOpenConsult(app.patientId)}
                          >
                            Diagnose
                          </Button>
                        ) : (
                          <span className="text-emerald-600 text-xs font-semibold flex items-center gap-0.5 px-3 py-1 bg-emerald-50 rounded-lg">
                            <Check className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                        <Button
                          variant="white"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewPatientDetails(patient)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Assigned Patients and Alerts */}
        <div className="space-y-6">
          <Card title="Patient Health Alerts" subtitle="Monitor critical signs">
            <div className="space-y-3">
              <div className="border border-rose-100 bg-rose-50/30 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-rose-800">BP Alert (Critical Room)</span>
                  <Badge className="bg-rose-50 text-rose-700">ICU Bed 1</Badge>
                </div>
                <p className="text-[11px] text-rose-700">
                  Patient <strong>Ananya Iyer</strong>'s heart rate spiked to 95 bpm, and SpO2 levels dropped to 94%.
                </p>
                <div className="flex justify-end pt-1">
                  <Button variant="danger" size="sm" onClick={() => handleViewPatientDetails(patients.find(p => p.id === 'P-102'))}>
                    View ICU Records
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Active Ward Patients" subtitle="Currently admitted under your care">
            <div className="space-y-3">
              {patients.filter(p => p.status === 'Admitted' || p.status === 'Critical').map(p => (
                <div key={p.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h5 className="font-semibold text-xs text-slate-800">{p.name}</h5>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{p.room} • BP: {p.vitals.bp}</span>
                  </div>
                  <Button variant="ghost" size="sm" icon={Eye} onClick={() => handleViewPatientDetails(p)}>
                    Chart
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Consultation Diagnosis & Prescription Modal */}
      <Modal
        isOpen={isConsultModalOpen}
        onClose={() => setIsConsultModalOpen(false)}
        title="Record Clinical Consultation Log"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConsultModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveConsult}>Save Log & Prescribe</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSaveConsult}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Select Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Diagnosis & Notes</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Mild hypertrophy, advised absolute bed rest for 3 days."
              rows={3}
              className="mt-1 w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
              <Pill className="w-4 h-4 text-blue-500" /> Prescribe Medication (Optional)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Medicine Formulation</label>
                <select
                  value={prescMed}
                  onChange={(e) => setPrescMed(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                >
                  <option value="">-- Select Medication (Optional) --</option>
                  {medicines.map((m) => (
                    <option key={m._id || m.id} value={m._id || m.id}>
                      {m.name} ({m.quantity ?? m.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Dosage (Morning-Noon-Night)</label>
                <input
                  type="text"
                  value={prescDosage}
                  onChange={(e) => setPrescDosage(e.target.value)}
                  placeholder="e.g. 1-0-1"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Duration</label>
                <input
                  type="text"
                  value={prescDuration}
                  onChange={(e) => setPrescDuration(e.target.value)}
                  placeholder="e.g. 15 days"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={Boolean(rescheduleModalAppt)}
        onClose={() => setRescheduleModalAppt(null)}
        title="Reschedule Appointment"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="white" onClick={() => setRescheduleModalAppt(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReschedule}>
              Confirm Reschedule
            </Button>
          </div>
        }
      >
        {rescheduleModalAppt && (
          <form onSubmit={handleConfirmReschedule} className="space-y-4">
            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs text-slate-500">Patient: <strong className="text-slate-800">{rescheduleModalAppt.patientName}</strong></div>
              <div className="text-xs text-slate-500">Current Slot: <strong className="text-slate-800">{rescheduleModalAppt.date} at {rescheduleModalAppt.time}</strong></div>
              <div className="text-xs text-slate-500">Department: <strong className="text-slate-800">{rescheduleModalAppt.department}</strong></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Date *</label>
                <input
                  type="date"
                  min={todayStr}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Time Slot *</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select time...</option>
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'].map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reschedule Notes / Reason</label>
              <textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="e.g. Moved to afternoon clinic due to emergency surgery."
                rows={3}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Patient Detail Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Patient Medical Profile Chart"
        size="lg"
        footer={<Button onClick={() => setIsDetailsModalOpen(false)}>Close Chart</Button>}
      >
        {selectedPatientDetails && (
          <div className="space-y-6">
            <div className="flex justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{selectedPatientDetails.name}</h3>
                <span className="text-xs text-slate-500">Patient ID: {selectedPatientDetails.id} • Room: {selectedPatientDetails.room}</span>
              </div>
              <Badge>{selectedPatientDetails.status}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Age / Gender</span>
                <span className="text-sm font-semibold text-slate-700 block mt-0.5">{selectedPatientDetails.age} yrs / {selectedPatientDetails.gender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Blood Group</span>
                <span className="text-sm font-semibold text-slate-700 block mt-0.5">{selectedPatientDetails.bloodGroup}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Phone Number</span>
                <span className="text-sm font-semibold text-slate-700 block mt-0.5">{selectedPatientDetails.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Admission Date</span>
                <span className="text-sm font-semibold text-slate-700 block mt-0.5">{selectedPatientDetails.admissionDate}</span>
              </div>
            </div>

            {/* Vitals */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Current Vitals</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="border border-slate-200 p-2 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Temperature</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedPatientDetails.vitals.temp}</span>
                </div>
                <div className="border border-slate-200 p-2 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Blood Pressure</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedPatientDetails.vitals.bp}</span>
                </div>
                <div className="border border-slate-200 p-2 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Heart Rate</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedPatientDetails.vitals.heartRate}</span>
                </div>
                <div className="border border-slate-200 p-2 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">SpO2 Level</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedPatientDetails.vitals.spo2}</span>
                </div>
              </div>
            </div>

            {/* Prescriptions */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Prescribed Medications</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Medicine</th>
                      <th className="px-4 py-2">Dosage</th>
                      <th className="px-4 py-2">Duration</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {selectedPatientDetails.prescriptions.map((pr, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{pr.medicine}</td>
                        <td className="px-4 py-2.5 text-slate-600">{pr.dosage}</td>
                        <td className="px-4 py-2.5 text-slate-600">{pr.duration}</td>
                        <td className="px-4 py-2.5">
                          <Badge>{pr.pharmacistGiven ? 'Dispensed' : 'Pending Pharmacy'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Clinical Diagnosis History</h4>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                {selectedPatientDetails.medicalHistory.map((hist, idx) => (
                  <li key={idx}>{hist}</li>
                ))}
              </ul>
            </div>

            {/* Nursing Notes */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Head Nurse Notes</h4>
              <div className="p-3.5 bg-blue-50/30 border border-blue-100 rounded-xl text-xs text-slate-600 leading-normal italic">
                "{selectedPatientDetails.nursingNotes}"
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
