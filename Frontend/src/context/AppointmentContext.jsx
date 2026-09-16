import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockDoctors, mockNurses, DEPARTMENT_DOCTORS, NURSE_SERVICES, mockActivities } from '../data/mockData';
import { appointmentService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { NotificationContext } from './NotificationContext';

export const AppointmentContext = createContext();

export const AppointmentProvider = ({ children }) => {
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx ? notifCtx.addNotification : null;
  const { user, isAuthenticated } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState({ doctors: [], nurses: [] });

  // Fetch providers list from backend
  const fetchProviders = useCallback(async () => {
    try {
      const res = await appointmentService.getProviders();
      if (res?.success) {
        setProviders({ doctors: res.doctors || [], nurses: res.nurses || [] });
      }
    } catch (err) {
      console.warn('Could not fetch dynamic providers, using mock lookup', err.message);
    }
  }, []);

  // Fetch appointments based on authenticated user's role
  const fetchAppointments = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setAppointments([]);
      return;
    }

    setLoading(true);
    try {
      let res;
      if (user.role === 'patient') {
        res = await appointmentService.getMyAppointments();
      } else if (user.role === 'doctor') {
        res = await appointmentService.getDoctorAppointments();
      } else if (user.role === 'nurse') {
        res = await appointmentService.getNurseAppointments();
      } else {
        res = await appointmentService.getAllAppointments();
      }

      if (res?.success && Array.isArray(res.appointments)) {
        setAppointments(res.appointments);
      }
    } catch (error) {
      console.error('Failed to fetch appointments from backend:', error.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  /**
   * Check if a specific slot is available for a provider on a date
   */
  const isSlotAvailable = (providerId, date, time, currentApptId = null) => {
    if (!providerId || !date || !time) return true;
    return !appointments.some(
      (a) =>
        (a._id !== currentApptId && a.id !== currentApptId) &&
        (a.providerId === providerId || a.providerId?.toString() === providerId?.toString()) &&
        a.date === date &&
        a.time === time &&
        a.status !== 'Cancelled'
    );
  };

  /**
   * Get available slots for a provider on a specific date
   */
  const getAvailableSlots = (providerId, date) => {
    let allSlots = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM'];
    const doc = mockDoctors.find((d) => d.id === providerId || d._id === providerId);
    if (doc?.availableSlots) {
      allSlots = doc.availableSlots;
    } else {
      const nurse = mockNurses.find((n) => n.id === providerId || n._id === providerId);
      if (nurse?.availableSlots) {
        allSlots = nurse.availableSlots;
      }
    }

    if (!date) return allSlots;

    return allSlots.map((slot) => ({
      time: slot,
      isAvailable: isSlotAvailable(providerId, date, slot),
    }));
  };

  /**
   * Book a new Doctor or Nurse Appointment (Persisted to MongoDB Atlas)
   */
  const bookAppointment = async ({
    type = 'doctor',
    providerId,
    department,
    service,
    reason = 'Consultation',
    date,
    time,
    notes = '',
  }) => {
    try {
      const payload = {
        type,
        providerId,
        department,
        service,
        reason,
        date,
        time,
        notes,
      };

      const res = await appointmentService.book(payload);

      if (res?.success && res.appointment) {
        const newAppointment = res.appointment;
        setAppointments((prev) => [newAppointment, ...prev.filter((a) => a._id !== newAppointment._id)]);

        // Log system activity
        mockActivities.unshift({
          id: Date.now(),
          text: `Appointment ${newAppointment.id} booked with ${newAppointment.providerName}`,
          time: 'Just now',
          type: 'success',
        });

        // Notify User
        if (addNotification) {
          addNotification(
            `Appointment Booked (${newAppointment.id})`,
            `Appointment with ${newAppointment.providerName} scheduled for ${date} at ${time}.`,
            'Appointment'
          );
        }

        return newAppointment;
      } else {
        throw new Error(res?.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error.message);
      throw error;
    }
  };

  /**
   * Update Status of an Appointment (Persisted to MongoDB Atlas)
   */
  const updateAppointmentStatus = async (id, newStatus, reasonOrNotes = '') => {
    try {
      const res = await appointmentService.updateStatus(id, newStatus, reasonOrNotes);
      if (res?.success && res.appointment) {
        const updated = res.appointment;
        setAppointments((prev) =>
          prev.map((app) => (app._id === updated._id || app.id === id ? updated : app))
        );

        if (addNotification) {
          addNotification(
            `Appointment ${newStatus}`,
            `Appointment ${id} status updated to ${newStatus}.`,
            'Appointment'
          );
        }

        return updated;
      }
    } catch (error) {
      console.error('Update status error:', error.message);
      throw error;
    }
  };

  /**
   * Cancel appointment helper
   */
  const cancelAppointment = async (id, reason = 'Cancelled by patient') => {
    return updateAppointmentStatus(id, 'Cancelled', reason);
  };

  /**
   * Filter Helpers
   */
  const getPatientAppointments = (patientId) => {
    return appointments.filter((a) => a.patientId === patientId || a.patientId?._id === patientId);
  };

  const getDoctorAppointments = (doctorId) => {
    return appointments.filter((a) => a.type === 'doctor' && (a.providerId === doctorId || a.providerId?._id === doctorId));
  };

  const getNurseAppointments = (nurseId) => {
    return appointments.filter((a) => a.type === 'nurse' && (a.providerId === nurseId || a.providerId?._id === nurseId));
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading,
        providers,
        bookAppointment,
        updateAppointmentStatus,
        cancelAppointment,
        isSlotAvailable,
        getAvailableSlots,
        getPatientAppointments,
        getDoctorAppointments,
        getNurseAppointments,
        refreshAppointments: fetchAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};
