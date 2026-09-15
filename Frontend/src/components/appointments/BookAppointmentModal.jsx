import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Stethoscope, HeartHandshake, CheckCircle2, User, FileText, AlertCircle, Sparkles, Building2, Activity } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../context/AppointmentContext';
import { mockDoctors, mockNurses, DEPARTMENT_DOCTORS, NURSE_SERVICES } from '../../data/mockData';

export const BookAppointmentModal = ({ isOpen, onClose, initialType = 'doctor' }) => {
  const { user } = useAuth();
  const { bookAppointment, isSlotAvailable } = useAppointments();

  const [bookingType, setBookingType] = useState(initialType); // 'doctor' | 'nurse'
  const [step, setStep] = useState(1); // 1: Details & Provider, 2: Slot & Reason, 3: Confirmed Summary

  // Form State
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [department, setDepartment] = useState('Cardiology');
  const [service, setService] = useState('General Checkup');
  const [preferredDate, setPreferredDate] = useState(() => {
    // default to today's date formatted as YYYY-MM-DD
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Assigned Provider State
  const [assignedProvider, setAssignedProvider] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  // Sync initial type and reset form upon opening
  useEffect(() => {
    if (isOpen) {
      setBookingType(initialType);
      setStep(1);
      setErrorMessage('');
      setConfirmedAppointment(null);
      setPatientName(user?.name || 'Gousik Lakshmanan');
      setPatientId(user?.id || 'P-105');
      setPreferredTime('');
      setReason('');
      setAdditionalNotes('');
      const today = new Date().toISOString().split('T')[0];
      setPreferredDate(today);

      if (initialType === 'doctor') {
        setDepartment('Cardiology');
      } else {
        setService('Blood Pressure Check');
      }
    }
  }, [isOpen, initialType, user]);

  // Determine Assigned Doctor automatically when Department changes
  useEffect(() => {
    if (bookingType === 'doctor') {
      const match = DEPARTMENT_DOCTORS.find(
        (d) => d.department.toLowerCase() === department.toLowerCase()
      );
      const docObj = mockDoctors.find((d) => d.id === match?.doctorId) || mockDoctors[0];
      setAssignedProvider(docObj);
      setPreferredTime(''); // reset slot when provider changes
    }
  }, [bookingType, department]);

  // Determine Assigned Nurse automatically when Service changes
  useEffect(() => {
    if (bookingType === 'nurse') {
      const match = NURSE_SERVICES.find(
        (s) => s.service.toLowerCase() === service.toLowerCase()
      );
      if (match) {
        setDepartment(match.department);
        const nurseObj = mockNurses.find((n) => n.id === match.nurseId) || mockNurses[0];
        setAssignedProvider(nurseObj);
      } else {
        const defaultNurse = mockNurses[0];
        setDepartment(defaultNurse.department);
        setAssignedProvider(defaultNurse);
      }
      setPreferredTime(''); // reset slot when service changes
    }
  }, [bookingType, service]);

  // Get available slots for the selected provider
  const getSlots = () => {
    if (!assignedProvider) return [];
    const slots = assignedProvider.availableSlots || [
      '09:00 AM',
      '10:00 AM',
      '11:30 AM',
      '02:00 PM',
      '04:00 PM'
    ];

    return slots.map((timeSlot) => {
      const available = isSlotAvailable(assignedProvider.id, preferredDate, timeSlot);
      return {
        time: timeSlot,
        isAvailable: available
      };
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleNext = () => {
    setErrorMessage('');
    if (!patientName.trim()) {
      setErrorMessage('Patient Name is required.');
      return;
    }
    if (bookingType === 'doctor' && !department) {
      setErrorMessage('Please select a department.');
      return;
    }
    if (bookingType === 'nurse' && !service) {
      setErrorMessage('Please select a service.');
      return;
    }
    setStep(2);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!preferredDate) {
      setErrorMessage('Please choose a preferred appointment date.');
      return;
    }
    if (preferredDate < todayStr) {
      setErrorMessage('Cannot book an appointment in the past. Please select today or a future date.');
      return;
    }
    if (!preferredTime) {
      setErrorMessage('Please select an available time slot.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Please enter a reason for the consultation/visit.');
      return;
    }

    try {
      const newAppt = bookAppointment({
        type: bookingType,
        patientId,
        patientName,
        department,
        service: bookingType === 'doctor' ? 'Consultation' : service,
        reason: reason.trim(),
        date: preferredDate,
        time: preferredTime,
        notes: additionalNotes.trim()
      });

      setConfirmedAppointment(newAppt);
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete appointment booking. Please try another slot.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        step === 3
          ? 'Appointment Confirmed!'
          : bookingType === 'doctor'
          ? 'Book Doctor Appointment'
          : 'Book Nurse / Diagnostic Service'
      }
    >
      {/* Stepper Header */}
      {step < 3 && (
        <div className="mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= 1 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}
              >
                1
              </div>
              <span className={`text-xs font-semibold ${step >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>
                {bookingType === 'doctor' ? 'Department & Doctor' : 'Service & Nurse'}
              </span>
            </div>

            <div className="w-12 h-0.5 bg-slate-200" />

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= 2 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold ${step >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>
                Schedule & Details
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Type Switcher, Department / Service Selection & Assigned Provider Card */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Appointment Type Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setBookingType('doctor');
                setDepartment('Cardiology');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                bookingType === 'doctor'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Doctor Consultation
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingType('nurse');
                setService('Blood Pressure Check');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                bookingType === 'nurse'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Nurse & Diagnostics
            </button>
          </div>

          {/* Patient Details Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Patient Name</label>
              <div className="mt-1 relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Patient ID</label>
              <input
                type="text"
                value={patientId}
                disabled
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 font-mono"
              />
            </div>
          </div>

          {/* DOCTOR SPECIFIC: Department Selection */}
          {bookingType === 'doctor' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Medical Department
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEPARTMENT_DOCTORS.map((dept) => {
                  const isSelected = department.toLowerCase() === dept.department.toLowerCase();
                  return (
                    <button
                      key={dept.department}
                      type="button"
                      onClick={() => setDepartment(dept.department)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 text-blue-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Building2 className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-semibold text-xs block">{dept.department}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{dept.specialization}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* NURSE SPECIFIC: Service Selection */}
          {bookingType === 'nurse' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Diagnostic / Nursing Service Required
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {NURSE_SERVICES.map((srv) => {
                  const isSelected = service.toLowerCase() === srv.service.toLowerCase();
                  return (
                    <button
                      key={srv.service}
                      type="button"
                      onClick={() => setService(srv.service)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 text-blue-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Activity className={`w-4 h-4 mb-1 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-semibold text-xs block">{srv.service}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{srv.department}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assigned Provider Card Display */}
          {assignedProvider && (
            <div className="p-4 bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-slate-50 rounded-xl border border-blue-100/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-blue-500/20">
                    {bookingType === 'doctor' ? (
                      <Stethoscope className="w-6 h-6" />
                    ) : (
                      <HeartHandshake className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      Auto-Assigned Healthcare Specialist
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 mt-0.5">{assignedProvider.name}</h4>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      {bookingType === 'doctor'
                        ? `${assignedProvider.specialty} • ${assignedProvider.department}`
                        : `${assignedProvider.department} • Head Nurse`}
                    </span>
                  </div>
                </div>
                <Badge variant="success">Available on Duty</Badge>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-100/60 flex items-center justify-between text-xs text-slate-500">
                <span>📍 {assignedProvider.room}</span>
                <span className="text-blue-700 font-medium">Auto-allocated based on department match</span>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleNext}>
              Continue to Schedule →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Date & Available Time Slots, Reason, Notes */}
      {step === 2 && (
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          {/* Summary pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Assigned Provider</span>
              <span className="font-bold text-slate-800">
                {assignedProvider?.name} ({department})
              </span>
            </div>
            {bookingType === 'nurse' && (
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Requested Service</span>
                <span className="font-bold text-blue-700">{service}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Change Department
            </button>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">Preferred Date</label>
            <div className="mt-1 relative max-w-sm">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                min={todayStr}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Available Time Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {getSlots().map((slot) => {
                const isSelected = preferredTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setPreferredTime(slot.time)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      !slot.isAvailable
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <span className="leading-none">{slot.time}</span>
                    <span className="text-[9px] mt-1 opacity-80">
                      {slot.isAvailable ? 'Available' : 'Booked'}
                    </span>
                  </button>
                );
              })}
            </div>
            {preferredTime === '' && (
              <span className="text-[10px] text-amber-600 mt-1 block">
                * Please select one of the available time chips above
              </span>
            )}
          </div>

          {/* Reason for visit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">Reason for Visit / Symptoms</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                bookingType === 'doctor'
                  ? 'e.g. Regular consultation, chest discomfort, checkup'
                  : 'e.g. Routine blood pressure checkup and vital recording'
              }
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Additional notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">Additional Medical Notes (Optional)</label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any prior medical records, allergies, or notes for the specialist..."
              className="mt-1 w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm & Register Slot
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 3: Confirmation Summary Screen */}
      {step === 3 && confirmedAppointment && (
        <div className="space-y-6 py-2">
          {/* Success Banner */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm mb-1 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Appointment Confirmed!</h3>
            <p className="text-xs text-slate-500">
              Your appointment has been successfully stored in the central MediSync schedule
            </p>
          </div>

          {/* Confirmed Details Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Unique Appointment ID
                </span>
                <span className="text-base font-bold font-mono text-blue-700">
                  {confirmedAppointment.id}
                </span>
              </div>
              <Badge variant="success">Status: Scheduled</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Patient Name</span>
                <span className="font-semibold text-slate-800 text-sm">{confirmedAppointment.patientName}</span>
                <span className="text-[10px] text-slate-400 block">ID: {confirmedAppointment.patientId}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                  {confirmedAppointment.type === 'doctor' ? 'Assigned Doctor' : 'Assigned Nurse'}
                </span>
                <span className="font-semibold text-slate-800 text-sm">{confirmedAppointment.providerName}</span>
                <span className="text-[10px] text-blue-600 block font-medium">
                  {confirmedAppointment.department}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Schedule Date & Time</span>
                <span className="font-semibold text-slate-800 block">
                  📅 {confirmedAppointment.date}
                </span>
                <span className="font-semibold text-blue-600 block">
                  ⏰ {confirmedAppointment.time}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                  {confirmedAppointment.type === 'doctor' ? 'Consultation Reason' : 'Requested Service'}
                </span>
                <span className="font-semibold text-slate-800 block">
                  {confirmedAppointment.type === 'nurse'
                    ? confirmedAppointment.service
                    : confirmedAppointment.reason}
                </span>
                {confirmedAppointment.type === 'nurse' && (
                  <span className="text-[10px] text-slate-500 block">{confirmedAppointment.reason}</span>
                )}
              </div>
            </div>

            {confirmedAppointment.notes && (
              <div className="pt-2 border-t border-slate-200/50 text-xs">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Notes</span>
                <p className="text-slate-600 italic mt-0.5">{confirmedAppointment.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 text-blue-800 p-3.5 rounded-xl border border-blue-100 text-xs flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This appointment is now immediately visible on the <strong>Patient Dashboard</strong> and in the{' '}
              <strong>
                {confirmedAppointment.type === 'doctor'
                  ? 'Doctor Consultation Queue (/doctor/appointments)'
                  : 'Nurse Appointments Queue (/nursee/appointments)'}
              </strong>.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={onClose} className="w-full sm:w-auto">
              Done & Return to Dashboard
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BookAppointmentModal;
