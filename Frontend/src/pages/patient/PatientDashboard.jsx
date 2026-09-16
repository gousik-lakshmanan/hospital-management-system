import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Calendar,
  Pill,
  Utensils,
  ReceiptText,
  Sparkles,
  Stethoscope,
  HeartHandshake,
  Clock,
  CheckCircle2,
  Plus,
  Building2,
  Activity
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { mockPatients, mockDietPlans, mockBills, billingService } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../context/AppointmentContext';
import BookAppointmentModal from '../../components/appointments/BookAppointmentModal';

export const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appointments, cancelAppointment } = useAppointments();

  const [patient] = useState(
    mockPatients.find((p) => p.id === 'P-105') || {
      id: 'P-105',
      name: 'Gousik Lakshmanan',
      vitals: { temp: '98.6 °F', bp: '120/80 mmHg', heartRate: '72 bpm', spo2: '99%' },
      bloodGroup: 'O-',
      status: 'Outpatient',
      room: 'Outpatient',
      medicalHistory: ['Allergic Rhinitis'],
      prescriptions: [
        { medicine: 'Cetirizine 10mg', dosage: '0-0-1', duration: '10 days', pharmacistGiven: true },
        { medicine: 'Montelukast 10mg', dosage: '0-0-1', duration: '10 days', pharmacistGiven: true }
      ]
    }
  );

  const [dietPlan] = useState(mockDietPlans.find((d) => d.id === 'P-105') || mockDietPlans[0]);
  const [bills, setBills] = useState(mockBills.filter((b) => b.patientId === 'P-105') || [mockBills[1]]);

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState('doctor'); // 'doctor' | 'nurse'

  // Appointment filter tab
  const [activeApptTab, setActiveApptTab] = useState('ALL'); // 'ALL' | 'DOCTOR' | 'NURSE'

  // Cancel Confirmation Modal State
  const [cancelModalAppt, setCancelModalAppt] = useState(null);

  // Other Modal open states
  const [activeModal, setActiveModal] = useState(null); // 'history' | 'prescriptions' | 'diet' | 'billing'

  const handleOpenBookModal = (type) => {
    setBookingType(type);
    setIsBookModalOpen(true);
  };

  const handlePayBill = (id) => {
    billingService.pay(id);
    setBills([...mockBills.filter((b) => b.patientId === 'P-105')]);
  };

  const handleConfirmCancel = () => {
    if (cancelModalAppt) {
      cancelAppointment(cancelModalAppt.id, 'Cancelled by patient');
      setCancelModalAppt(null);
    }
  };

  // Filter appointments for this logged-in patient
  const patientAppointments = appointments.filter(
    (a) => a.patientId === (user?.id || 'P-105')
  );

  const filteredAppointments = patientAppointments.filter((a) => {
    if (activeApptTab === 'DOCTOR') return a.type === 'doctor';
    if (activeApptTab === 'NURSE') return a.type === 'nurse';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
            Patient Portal Desk
          </span>
          <h2 className="text-xl font-bold text-white">Hello, {patient.name}</h2>
          <p className="text-xs text-blue-100">
            Intelligent Connected Hospital Portal • Book Doctor & Nurse Services Seamlessly
          </p>
        </div>

        {/* Health Streak */}
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-sm shadow-xs">
            🔥
          </div>
          <div>
            <span className="text-[10px] text-blue-100 block font-semibold uppercase tracking-wider">
              Health Streak
            </span>
            <span className="text-base font-bold text-white block leading-none mt-0.5">
              {dietPlan.streak} Days Active
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS SECTION (Doctor & Nurse Booking Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" /> Quick Actions
          </h3>
          <span className="text-xs text-slate-400">Book instant consultations and tests</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: + Book Appointment - Doctor */}
          <div
            onClick={() => handleOpenBookModal('doctor')}
            className="group relative bg-white border border-blue-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-500 transition-all cursor-pointer overflow-hidden bg-gradient-to-br from-white to-blue-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
                  <div className="relative">
                    <Calendar className="w-7 h-7" />
                    <Stethoscope className="w-4 h-4 text-sky-200 absolute -bottom-1 -right-1 bg-blue-700 rounded-full p-0.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    + Book Appointment - Doctor
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Cardiology, General Medicine, Orthopedics & Dermatology specialists
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      4 Dept Specialists Available
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: + Book Appointment - Nurse */}
          <div
            onClick={() => handleOpenBookModal('nurse')}
            className="group relative bg-white border border-sky-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-sky-500 transition-all cursor-pointer overflow-hidden bg-gradient-to-br from-white to-sky-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform shrink-0">
                  <div className="relative">
                    <Calendar className="w-7 h-7" />
                    <HeartHandshake className="w-4 h-4 text-blue-100 absolute -bottom-1 -right-1 bg-sky-700 rounded-full p-0.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                    + Book Appointment - Nurse
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    BP check, Blood test sample, Vital signs & Health screening
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                      Diagnostic & Screening Units
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MY APPOINTMENTS SECTION (Connected Real-Time State) */}
      <Card
        title="MY APPOINTMENTS"
        subtitle="Live synchronization with assigned doctor and nurse queues"
        action={
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveApptTab('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeApptTab === 'ALL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ALL ({patientAppointments.length})
            </button>
            <button
              onClick={() => setActiveApptTab('DOCTOR')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeApptTab === 'DOCTOR'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DOCTOR ({patientAppointments.filter((a) => a.type === 'doctor').length})
            </button>
            <button
              onClick={() => setActiveApptTab('NURSE')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeApptTab === 'NURSE'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NURSE ({patientAppointments.filter((a) => a.type === 'nurse').length})
            </button>
          </div>
        }
      >
        {filteredAppointments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">No appointments in this category</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Use the Quick Actions buttons above to schedule a new doctor consultation or nurse service.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((appt) => {
              const isDoctor = appt.type === 'doctor';
              return (
                <div
                  key={appt.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-xs"
                >
                  {/* Card Header: Type Badge & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isDoctor
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-teal-100 text-teal-800 border border-teal-200'
                      }`}
                    >
                      {isDoctor ? (
                        <>
                          <Stethoscope className="w-3 h-3" /> DOCTOR APPOINTMENT
                        </>
                      ) : (
                        <>
                          <HeartHandshake className="w-3 h-3" /> NURSE APPOINTMENT
                        </>
                      )}
                    </span>
                    <Badge>{appt.status}</Badge>
                  </div>

                  {/* Provider & Department */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isDoctor
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-teal-50 text-teal-700 border border-teal-100'
                      }`}
                    >
                      {appt.providerName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm text-slate-800 truncate">{appt.providerName}</h4>
                      <span className="text-xs text-slate-500 font-medium block truncate">
                        {appt.department}
                      </span>
                    </div>
                  </div>

                  {/* Appointment Details Grid */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> Date:
                      </span>
                      <span className="font-semibold text-slate-800">{appt.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" /> Time:
                      </span>
                      <span className="font-semibold text-blue-700">{appt.time}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 border-t border-slate-200/50 pt-1.5">
                      <span className="text-slate-500">
                        {isDoctor ? 'Reason:' : 'Service:'}
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">
                        {isDoctor ? appt.reason : appt.service}
                      </span>
                    </div>
                    {appt.notes && (
                      <div className="text-[10px] text-slate-500 italic pt-1 truncate">
                        "{appt.notes}"
                      </div>
                    )}
                  </div>

                  {/* Card Footer: ID and Cancel action */}
                  <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      ID: {appt.id}
                    </span>
                    {appt.status === 'Scheduled' && (
                      <button
                        onClick={() => setCancelModalAppt(appt)}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    {appt.status === 'Confirmed' && (
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    )}
                    {appt.status === 'Completed' && (
                      <span className="text-[10px] font-semibold text-slate-500">
                        Concluded
                      </span>
                    )}
                    {appt.status === 'Cancelled' && (
                      <span className="text-[10px] font-semibold text-rose-500">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Main Lower Grid Layout (Clinical Desk, Prescriptions, Vitals, Diet) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Clinical Desk Shortcuts */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Patient Clinical Service Desk"
            subtitle="Quick shortcuts to your personal medical records and AI tools"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveModal('history')}
                className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer group"
              >
                <HeartPulse className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Medical History</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Vitals, charts, allergies</span>
              </button>

              <button
                onClick={() => setActiveModal('prescriptions')}
                className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer group"
              >
                <Pill className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Prescriptions</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Dosage guidelines</span>
              </button>

              <button
                onClick={() => setActiveModal('diet')}
                className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer group"
              >
                <Utensils className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Dietary Profile</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Calories, water intake</span>
              </button>

              <button
                onClick={() => navigate('/ai/report-summarizer')}
                className="p-4 border border-slate-200 rounded-xl bg-blue-50/20 hover:bg-blue-50/50 text-left transition-all cursor-pointer group border-blue-100"
              >
                <Sparkles className="w-6 h-6 text-blue-700 mb-2 group-hover:scale-105 transition-transform animate-pulse" />
                <span className="font-semibold text-xs text-slate-800 block">AI Summarizer</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Summarize lab reports</span>
              </button>

              <button
                onClick={() => setActiveModal('billing')}
                className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer group"
              >
                <ReceiptText className="w-6 h-6 text-rose-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Bills & Invoices</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">View outstanding fees</span>
              </button>

              <button
                onClick={() => navigate('/patient/rooms')}
                className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-all cursor-pointer group"
              >
                <Building2 className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Resource Status</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Rooms, pharmacy stock</span>
              </button>
            </div>
          </Card>

          {/* Current medications */}
          <Card title="Daily Medication Prescriptions" subtitle="Your current active doctor prescription round">
            <div className="divide-y divide-slate-100">
              {patient.prescriptions.map((pr, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">{pr.medicine}</h4>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Dosage: {pr.dosage}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-500 block">Duration: {pr.duration}</span>
                    <Badge className="mt-1">{pr.pharmacistGiven ? 'Dispensed' : 'Pending Counter'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Vitals & Meal Budget */}
        <div className="space-y-6">
          <Card title="Patient Clinical Snapshot" subtitle="Recorded physical metrics">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Body Temp</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">{patient.vitals.temp}</span>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">BP Target</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">{patient.vitals.bp}</span>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Heart Rate</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">{patient.vitals.heartRate}</span>
              </div>
              <div className="border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Blood Group</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">{patient.bloodGroup}</span>
              </div>
            </div>
          </Card>

          {/* Diet overview summary */}
          <Card title="Today's Meal Target" subtitle="Assigned recovery diet plan">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Daily Calorie Budget</span>
                <span className="font-bold text-slate-800">{dietPlan.calories}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Water Intake Target</span>
                <span className="font-bold text-slate-800">{dietPlan.waterIntake}</span>
              </div>
              <div className="space-y-2 pt-1 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                    Breakfast Recommendation
                  </span>
                  <span className="text-slate-600 block mt-0.5 font-medium">{dietPlan.breakfast}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                    Lunch Recommendation
                  </span>
                  <span className="text-slate-600 block mt-0.5 font-medium">{dietPlan.lunch}</span>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveModal('diet')}>
                  View Weekly Schedule
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        initialType={bookingType}
      />

      {/* CANCEL APPOINTMENT CONFIRMATION MODAL */}
      <Modal
        isOpen={!!cancelModalAppt}
        onClose={() => setCancelModalAppt(null)}
        title="Cancel Appointment Confirmation"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelModalAppt(null)}>
              Keep Appointment
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel}>
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        {cancelModalAppt && (
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Are you sure you want to cancel your appointment with{' '}
              <strong>{cancelModalAppt.providerName}</strong> scheduled on{' '}
              <strong>{cancelModalAppt.date}</strong> at <strong>{cancelModalAppt.time}</strong>?
            </p>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg">
              ⚠️ The slot ({cancelModalAppt.time}) will be released and made available for other patients.
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={activeModal === 'history'}
        onClose={() => setActiveModal(null)}
        title="Personal Medical History Chart"
        footer={<Button onClick={() => setActiveModal(null)}>Close Records</Button>}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="border border-slate-200 p-2 rounded-lg bg-slate-50/50">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Body Temp</span>
              <span className="text-xs font-bold text-slate-700 block mt-0.5">{patient.vitals.temp}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded-lg bg-slate-50/50">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">BP Target</span>
              <span className="text-xs font-bold text-slate-700 block mt-0.5">{patient.vitals.bp}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded-lg bg-slate-50/50">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Heart Rate</span>
              <span className="text-xs font-bold text-slate-700 block mt-0.5">{patient.vitals.heartRate}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded-lg bg-slate-50/50">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Blood Group</span>
              <span className="text-xs font-bold text-slate-700 block mt-0.5">{patient.bloodGroup}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Admitted History & Allergies</h4>
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Allergic History</span>
                <span className="font-semibold text-rose-600">Allergic Rhinitis (Dust/Pollen)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Admissions Status</span>
                <span className="font-semibold text-slate-600">{patient.status}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Department Room</span>
                <span className="font-semibold text-slate-600">{patient.room}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Diagnostic Timeline</h4>
            <div className="space-y-2 text-xs text-slate-600 pl-4 border-l border-blue-200 ml-1">
              {patient.medicalHistory.map((h, idx) => (
                <div key={idx} className="relative py-1">
                  <span className="absolute -left-[20px] top-2.5 w-2 h-2 rounded-full bg-blue-500" />
                  <p>{h}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 2. Prescriptions Modal */}
      <Modal
        isOpen={activeModal === 'prescriptions'}
        onClose={() => setActiveModal(null)}
        title="Doctor Prescription List"
        footer={<Button onClick={() => setActiveModal(null)}>Close List</Button>}
      >
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Medicine Formulation</th>
                  <th className="p-3">Dosage Timing</th>
                  <th className="p-3">Expiry Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {patient.prescriptions.map((pr, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-slate-800">{pr.medicine}</td>
                    <td className="p-3">{pr.dosage}</td>
                    <td className="p-3">{pr.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 text-blue-800 text-[10px] p-3 rounded-lg border border-blue-100 leading-normal">
            💡 <strong>Dosage Key:</strong> 1-0-1 represents (Morning - Afternoon - Night). Present this list to the hospital dispensary counter to pick up medicines.
          </div>
        </div>
      </Modal>

      {/* 3. Diet Plan Modal */}
      <Modal
        isOpen={activeModal === 'diet'}
        onClose={() => setActiveModal(null)}
        title="Recovery Diet Plan Layout"
        footer={<Button onClick={() => setActiveModal(null)}>Close Schedule</Button>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Breakfast Target</span>
              <p className="text-xs text-slate-700 mt-1 font-semibold">{dietPlan.breakfast}</p>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Lunch Target</span>
              <p className="text-xs text-slate-700 mt-1 font-semibold">{dietPlan.lunch}</p>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Dinner Target</span>
              <p className="text-xs text-slate-700 mt-1 font-semibold">{dietPlan.dinner}</p>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Snacks recommendation</span>
              <p className="text-xs text-slate-700 mt-1 font-semibold">{dietPlan.snacks}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Dietary Nutrition:</span>
            <span className="text-slate-800">{dietPlan.nutrition}</span>
          </div>
        </div>
      </Modal>

      {/* 4. Billing Modal */}
      <Modal
        isOpen={activeModal === 'billing'}
        onClose={() => setActiveModal(null)}
        title="My Bills & Invoices"
        footer={<Button onClick={() => setActiveModal(null)}>Close Billing</Button>}
      >
        <div className="space-y-4">
          {bills.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No bills on file.
            </div>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <span className="font-semibold text-xs text-slate-800">{bill.id}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Date: {bill.date}</span>
                  </div>
                  <Badge>{bill.status}</Badge>
                </div>

                <div className="space-y-1 text-xs text-slate-600 border-t border-b border-slate-200 py-3">
                  <div className="flex justify-between">
                    <span>Clinical Room Charges:</span>
                    <span>₹{bill.roomCharges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doctor Consult Charges:</span>
                    <span>₹{bill.doctorCharges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pharmacy Medicines Charges:</span>
                    <span>₹{bill.medicineCharges}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 pt-1.5 border-t border-slate-200/50">
                    <span>Total Amount Due:</span>
                    <span>₹{bill.total}</span>
                  </div>
                </div>

                {bill.status === 'Pending' && (
                  <div className="flex justify-end pt-1">
                    <Button variant="primary" size="sm" onClick={() => handlePayBill(bill.id)}>
                      Pay Bill (Mock Gateway)
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PatientDashboard;
