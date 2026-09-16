import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Stethoscope,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  X,
  Check,
  RefreshCw,
  Loader2,
  Hospital
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../context/AppointmentContext';
import appointmentService from '../../services/appointmentService';

export const BookAppointmentModal = ({ isOpen, onClose, initialType = 'doctor' }) => {
  const { user } = useAuth();
  const { bookAppointment, isSlotAvailable, refreshAppointments } = useAppointments();

  const [bookingType, setBookingType] = useState(initialType); // 'doctor' | 'nurse'
  const [step, setStep] = useState(1); // 1: Provider Selection, 2: Schedule & Reason, 3: Confirmation Summary

  // Provider Fetching State (Direct MongoDB API source of truth)
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerFetchError, setProviderFetchError] = useState(null);
  const [rawDoctors, setRawDoctors] = useState([]);
  const [rawNurses, setRawNurses] = useState([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [department, setDepartment] = useState('');
  const [service, setService] = useState('Blood Pressure Check');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Submission State
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  // Fetch Providers directly from backend MongoDB
  const fetchActiveProviders = useCallback(async () => {
    setLoadingProviders(true);
    setProviderFetchError(null);
    try {
      const res = await appointmentService.getProviders();
      if (res?.success) {
        setRawDoctors(res.doctors || []);
        setRawNurses(res.nurses || []);
      } else {
        throw new Error(res?.message || 'Failed to load active healthcare providers');
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
      setProviderFetchError(err.response?.data?.message || err.message || 'Unable to connect to hospital providers database.');
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  // Sync on modal open
  useEffect(() => {
    if (isOpen) {
      setBookingType(initialType);
      setStep(1);
      setSearchQuery('');
      setErrorMessage('');
      setConfirmedAppointment(null);
      setPreferredTime('');
      setReason('');
      setAdditionalNotes('');
      const today = new Date().toISOString().split('T')[0];
      setPreferredDate(today);

      if (initialType === 'nurse') {
        setService('Blood Pressure Check');
      }

      fetchActiveProviders();
    }
  }, [isOpen, initialType, fetchActiveProviders]);

  // Available raw providers for active tab
  const rawList = bookingType === 'doctor' ? rawDoctors : rawNurses;

  // Authoritative Deduplication strictly by MongoDB _id / id
  const currentProviders = useMemo(() => {
    return rawList.filter((provider, index, self) => {
      const pId = provider._id || provider.id;
      return Boolean(pId) && index === self.findIndex((item) => (item._id || item.id) === pId);
    });
  }, [rawList]);

  // Client-side search filtering
  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return currentProviders;
    const q = searchQuery.toLowerCase().trim();
    return currentProviders.filter((p) => {
      const name = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
      const dept = (p.department || '').toLowerCase();
      const spec = (p.specialization || p.shift || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(q) || dept.includes(q) || spec.includes(q) || email.includes(q);
    });
  }, [currentProviders, searchQuery]);

  // Active selected provider object
  const selectedProvider = useMemo(() => {
    return currentProviders.find((p) => (p._id || p.id) === selectedProviderId) || null;
  }, [currentProviders, selectedProviderId]);

  // Auto-select first provider when loaded if none selected
  useEffect(() => {
    if (currentProviders.length > 0 && (!selectedProviderId || !currentProviders.some(p => (p._id || p.id) === selectedProviderId))) {
      setSelectedProviderId(currentProviders[0]._id || currentProviders[0].id);
      setDepartment(currentProviders[0].department || '');
    }
  }, [currentProviders, selectedProviderId]);

  // When selected provider changes, keep department in sync
  const handleSelectProvider = (p) => {
    const pId = p._id || p.id;
    setSelectedProviderId(pId);
    setDepartment(p.department || '');
    setErrorMessage('');
  };

  // Get available slots for the selected provider
  const defaultSlots = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM'
  ];

  const getSlots = () => {
    const providerKey = selectedProvider?._id || selectedProvider?.id;
    return defaultSlots.map((timeSlot) => {
      const available = isSlotAvailable(providerKey, preferredDate, timeSlot);
      return {
        time: timeSlot,
        isAvailable: available
      };
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleNextStep = () => {
    setErrorMessage('');
    if (!selectedProvider) {
      setErrorMessage(`Please select a specific ${bookingType === 'doctor' ? 'doctor' : 'nurse'} from the list to continue.`);
      return;
    }
    setStep(2);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedProvider) {
      setErrorMessage(`Please select a ${bookingType === 'doctor' ? 'doctor' : 'nurse'}.`);
      setStep(1);
      return;
    }

    if (!preferredDate) {
      setErrorMessage('Please choose an appointment date.');
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

    setSubmitting(true);
    try {
      const newAppt = await bookAppointment({
        type: bookingType,
        providerId: selectedProvider._id || selectedProvider.id,
        service: bookingType === 'nurse' ? service : 'Consultation',
        reason: reason.trim(),
        date: preferredDate,
        time: preferredTime,
        notes: additionalNotes.trim(),
      });

      setConfirmedAppointment(newAppt);
      setStep(3);
      refreshAppointments?.();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit appointment request.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDoctor = bookingType === 'doctor';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        step === 3
          ? 'Appointment Request Confirmed'
          : isDoctor
          ? 'Book Doctor Consultation'
          : 'Book Nurse Care & Diagnostics'
      }
    >
      {/* Visual Stepper Bar */}
      {step < 3 && (
        <div className="mb-4 border-b border-slate-100 pb-3.5">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step >= 1 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}
              >
                1
              </div>
              <span className={`text-xs font-semibold ${step >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>
                {isDoctor ? 'Select Doctor' : 'Select Nurse'}
              </span>
            </div>

            <div className="w-10 h-0.5 bg-slate-200" />

            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
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

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-xs animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: SELECT A SPECIFIC DOCTOR OR NURSE                                 */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Header Description & Role Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                {isDoctor ? (
                  <>
                    <Stethoscope className="w-4 h-4 text-blue-600" /> Select a Doctor
                  </>
                ) : (
                  <>
                    <HeartHandshake className="w-4 h-4 text-teal-600" /> Select a Nurse
                  </>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                Choose a verified hospital practitioner from the MongoDB roster below.
              </p>
            </div>

            {/* Persona Switcher Chips */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setBookingType('doctor');
                  setSearchQuery('');
                  setErrorMessage('');
                  if (rawDoctors.length > 0) {
                    setSelectedProviderId(rawDoctors[0]._id || rawDoctors[0].id);
                  }
                }}
                className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isDoctor
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" /> Doctor
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookingType('nurse');
                  setSearchQuery('');
                  setErrorMessage('');
                  if (rawNurses.length > 0) {
                    setSelectedProviderId(rawNurses[0]._id || rawNurses[0].id);
                  }
                }}
                className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isDoctor
                    ? 'bg-white text-teal-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" /> Nurse
              </button>
            </div>
          </div>

          {/* Client-Side Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isDoctor
                  ? 'Search by doctor name, department, or specialization...'
                  : 'Search by nurse name or shift...'
              }
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ===================================================================== */}
          {/* PROVIDER LIST: LOADING / ERROR / EMPTY / CARDS                       */}
          {/* ===================================================================== */}
          <div className="min-h-[200px]">
            {loadingProviders ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-slate-50/50 rounded-2xl border border-slate-200/80">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-medium text-slate-600">
                  Loading available {isDoctor ? 'doctors' : 'nurses'} from hospital database...
                </p>
              </div>
            ) : providerFetchError ? (
              <div className="p-6 bg-rose-50/70 border border-rose-200 rounded-2xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-rose-800">Unable to load providers</h4>
                  <p className="text-[11px] text-rose-600 mt-0.5">{providerFetchError}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={fetchActiveProviders}
                  className="bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  Retry Connection
                </Button>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50">
                <Hospital className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  {searchQuery
                    ? `No ${isDoctor ? 'doctors' : 'nurses'} found matching "${searchQuery}"`
                    : `No ${isDoctor ? 'doctors' : 'nurses'} are currently available.`}
                </p>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear search filter
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RefreshCw}
                    onClick={fetchActiveProviders}
                    className="mt-1"
                  >
                    Refresh List
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {filteredProviders.map((p) => {
                  const pId = p._id || p.id;
                  const isSelected = (selectedProvider?._id || selectedProvider?.id) === pId;

                  // Initials for avatar
                  const initials = p.name
                    ? p.name
                        .replace(/^(Dr\.|Doctor|Nurse)\s+/i, '')
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : isDoctor
                    ? 'DR'
                    : 'NR';

                  return (
                    <div
                      key={pId}
                      onClick={() => handleSelectProvider(p)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            isDoctor
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                              : 'bg-gradient-to-br from-teal-600 to-emerald-700 text-white'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="overflow-hidden min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">
                            {p.name}
                          </h4>
                          <span className="text-[11px] text-slate-600 font-medium block truncate mt-0.5">
                            {p.department || (isDoctor ? 'Cardiology' : 'General Nursing')}
                          </span>
                          {(p.specialization || p.shift) && (
                            <span className="text-[10px] text-blue-600 font-medium block truncate mt-0.5">
                              {p.specialization || p.shift}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Status & Select Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          On Duty
                        </span>

                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                            <Check className="w-3 h-3 stroke-[2.5]" /> Selected
                          </span>
                        ) : (
                          <span className="text-slate-500 hover:text-blue-600 font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors">
                            Select →
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Service dropdown for Nurse */}
          {!isDoctor && (
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Nursing / Diagnostic Service
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="Blood Pressure Check">Blood Pressure Check</option>
                <option value="Blood Sugar Test (Glucose)">Blood Sugar Test (Glucose)</option>
                <option value="Vital Signs Monitoring">Vital Signs Monitoring</option>
                <option value="Routine Health Screening">Routine Health Screening</option>
                <option value="Sample Collection Support">Sample Collection Support</option>
                <option value="General Nursing Care">General Nursing Care</option>
              </select>
            </div>
          )}

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              {selectedProvider ? (
                <span>
                  Selected: <strong className="text-slate-800">{selectedProvider.name}</strong>
                </span>
              ) : (
                'Select a practitioner above'
              )}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={!selectedProvider || loadingProviders}
              >
                Continue to Schedule →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: DATE & TIME SLOTS, REASON, ADDITIONAL NOTES                       */}
      {/* ========================================================================= */}
      {step === 2 && (
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          {/* Selected Provider Card Pill */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                  isDoctor ? 'bg-blue-600' : 'bg-teal-600'
                }`}
              >
                {selectedProvider?.name
                  ?.replace(/^(Dr\.|Doctor|Nurse)\s+/i, '')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('') || 'HP'}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                  {isDoctor ? 'Selected Doctor' : 'Selected Nurse'}
                </span>
                <span className="font-bold text-slate-800 text-sm">{selectedProvider?.name}</span>
                <span className="text-[11px] text-slate-500 block">
                  {selectedProvider?.department || (isDoctor ? 'Cardiology' : 'General Nursing')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs"
            >
              Change Provider
            </button>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Appointment Date *
            </label>
            <div className="relative max-w-sm">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                min={todayStr}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Time Slot Grid */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Select Consultation Slot *
              </label>
              <span className="text-[10px] text-slate-400">Slots for {preferredDate}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {getSlots().map((slot) => {
                const isSelected = preferredTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setPreferredTime(slot.time)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
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
            {!preferredTime && (
              <span className="text-[11px] text-amber-600 mt-1 block font-medium">
                * Please click on one of the available time chips above
              </span>
            )}
          </div>

          {/* Reason for visit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Visit / Symptoms *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isDoctor
                  ? 'e.g. Chest discomfort consultation, annual cardiac checkup'
                  : 'e.g. Routine vitals and blood pressure checkup'
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Additional Medical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Medical Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any prior medical records, allergies, or notes for the specialist..."
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
              ← Back to Providers
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} disabled={!preferredTime}>
                Submit Appointment Request
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CONFIRMATION SUMMARY                                              */}
      {/* ========================================================================= */}
      {step === 3 && confirmedAppointment && (
        <div className="space-y-5 py-2">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 shadow-sm mb-1">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Appointment Request Sent!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your appointment has been logged in MongoDB and submitted to{' '}
              <strong>{confirmedAppointment.providerName}</strong>. Status is currently <strong>Pending Review</strong>.
            </p>
          </div>

          {/* Confirmation Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3.5 shadow-xs text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Reference ID
                </span>
                <span className="text-sm font-bold font-mono text-blue-700">
                  {confirmedAppointment.id || confirmedAppointment._id}
                </span>
              </div>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                Pending Review
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Patient</span>
                <span className="font-semibold text-slate-800">{confirmedAppointment.patientName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                  {confirmedAppointment.type === 'doctor' ? 'Selected Doctor' : 'Selected Nurse'}
                </span>
                <span className="font-semibold text-slate-800">{confirmedAppointment.providerName}</span>
                <span className="text-[10px] text-blue-600 block font-medium">
                  {confirmedAppointment.department}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Requested Schedule</span>
                <span className="font-semibold text-slate-800 block">
                  📅 {confirmedAppointment.date} at {confirmedAppointment.time}
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
              </div>
            </div>

            {confirmedAppointment.notes && (
              <div className="pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Notes</span>
                <p className="text-slate-600 italic mt-0.5">{confirmedAppointment.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              The provider will review your booking on their dashboard. You will see live updates in <strong>My Appointments</strong>.
            </p>
          </div>

          <div className="flex justify-end pt-1">
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

