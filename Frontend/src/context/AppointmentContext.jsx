import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockAppointments, mockDoctors, mockNurses, DEPARTMENT_DOCTORS, NURSE_SERVICES, mockActivities } from '../data/mockData';
import { NotificationContext } from './NotificationContext';

export const AppointmentContext = createContext();

const STORAGE_KEY = 'medisync_appointments';

export const AppointmentProvider = ({ children }) => {
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx ? notifCtx.addNotification : null;

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse appointments from localStorage', e);
    }
    return mockAppointments;
  });

  // Keep localStorage updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    } catch (e) {
      console.error('Failed to persist appointments to localStorage', e);
    }
  }, [appointments]);

  /**
   * Check if a specific slot is available for a provider on a date
   */
  const isSlotAvailable = (providerId, date, time, currentApptId = null) => {
    if (!providerId || !date || !time) return true;
    return !appointments.some(
      (a) =>
        a.id !== currentApptId &&
        a.providerId === providerId &&
        a.date === date &&
        a.time === time &&
        a.status !== 'Cancelled'
    );
  };

  /**
   * Get available slots for a provider on a specific date
   */
  const getAvailableSlots = (providerId, date) => {
    let allSlots = [];
    const doc = mockDoctors.find((d) => d.id === providerId);
    if (doc) {
      allSlots = doc.availableSlots || ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM'];
    } else {
      const nurse = mockNurses.find((n) => n.id === providerId);
      if (nurse) {
        allSlots = nurse.availableSlots || ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
      } else {
        allSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
      }
    }

    if (!date) return allSlots;

    return allSlots.map((slot) => ({
      time: slot,
      isAvailable: isSlotAvailable(providerId, date, slot)
    }));
  };

  /**
   * Book a new Doctor or Nurse Appointment
   */
  const bookAppointment = ({
    type = 'doctor', // 'doctor' | 'nurse'
    patientId = 'P-105',
    patientName = 'Gousik Lakshmanan',
    department,
    service,
    reason = 'Consultation',
    date,
    time,
    notes = ''
  }) => {
    let assignedProviderId = '';
    let assignedProviderName = '';
    let assignedDepartment = department;
    let assignedService = service || 'Consultation';

    if (type === 'doctor') {
      const match = DEPARTMENT_DOCTORS.find((d) => d.department.toLowerCase() === (department || '').toLowerCase());
      if (match) {
        assignedProviderId = match.doctorId;
        assignedProviderName = match.doctorName;
        assignedDepartment = match.department;
      } else {
        const defaultDoc = mockDoctors[0];
        assignedProviderId = defaultDoc.id;
        assignedProviderName = defaultDoc.name;
        assignedDepartment = defaultDoc.department;
      }
    } else {
      const match = NURSE_SERVICES.find((s) => s.service.toLowerCase() === (service || '').toLowerCase());
      if (match) {
        assignedProviderId = match.nurseId;
        assignedProviderName = match.nurseName;
        assignedDepartment = match.department;
        assignedService = match.service;
      } else {
        const defaultNurse = mockNurses[0];
        assignedProviderId = defaultNurse.id;
        assignedProviderName = defaultNurse.name;
        assignedDepartment = defaultNurse.department;
        assignedService = service || defaultNurse.services[0];
      }
    }

    // Duplicate Check
    if (!isSlotAvailable(assignedProviderId, date, time)) {
      throw new Error('Selected time slot is no longer available. Please choose another time.');
    }

    // Generate unique ID
    const count = appointments.filter((a) => a.type === type).length + 1001;
    const prefix = type === 'doctor' ? 'APT-D' : 'APT-N';
    const newId = `${prefix}-${count}`;

    const newAppointment = {
      id: newId,
      type,
      patientId,
      patientName,
      providerId: assignedProviderId,
      providerName: assignedProviderName,
      department: assignedDepartment,
      service: assignedService,
      reason,
      date,
      time,
      status: 'Scheduled',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // System activity log
    mockActivities.unshift({
      id: Date.now(),
      text: `Appointment ${newId} booked for ${patientName} with ${assignedProviderName}`,
      time: 'Just now',
      type: 'success'
    });

    // Notify User
    if (addNotification) {
      addNotification(
        `Appointment Booked (${newId})`,
        `Appointment with ${assignedProviderName} scheduled for ${date} at ${time}.`,
        'Appointment'
      );
    }

    return newAppointment;
  };

  /**
   * Update Status of an Appointment (Scheduled -> Confirmed -> Completed / Cancelled / Rescheduled)
   */
  const updateAppointmentStatus = (id, newStatus, reasonOrNotes = '') => {
    let updatedAppt = null;

    setAppointments((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          updatedAppt = {
            ...app,
            status: newStatus,
            notes: reasonOrNotes ? `${app.notes ? app.notes + ' | ' : ''}${reasonOrNotes}` : app.notes,
            updatedAt: new Date().toISOString()
          };
          return updatedAppt;
        }
        return app;
      })
    );

    if (updatedAppt) {
      // Activity
      mockActivities.unshift({
        id: Date.now(),
        text: `Appointment ${id} status changed to ${newStatus} (${updatedAppt.providerName})`,
        time: 'Just now',
        type: newStatus === 'Completed' ? 'success' : newStatus === 'Cancelled' ? 'warning' : 'info'
      });

      // Notification
      if (addNotification) {
        let msg = `Appointment ${id} status updated to ${newStatus}.`;
        if (newStatus === 'Confirmed') {
          msg = `Your appointment with ${updatedAppt.providerName} on ${updatedAppt.date} has been confirmed.`;
        } else if (newStatus === 'Completed') {
          msg = `Your appointment with ${updatedAppt.providerName} has been marked completed.`;
        } else if (newStatus === 'Cancelled') {
          msg = `Appointment ${id} with ${updatedAppt.providerName} was cancelled.`;
        }

        addNotification(`Appointment ${newStatus}`, msg, 'Appointment');
      }
    }

    return updatedAppt;
  };

  /**
   * Cancel appointment helper
   */
  const cancelAppointment = (id, reason = 'Cancelled by patient') => {
    return updateAppointmentStatus(id, 'Cancelled', reason);
  };

  /**
   * Filter Helpers
   */
  const getPatientAppointments = (patientId) => {
    return appointments.filter((a) => a.patientId === patientId);
  };

  const getDoctorAppointments = (doctorId) => {
    return appointments.filter((a) => a.type === 'doctor' && a.providerId === doctorId);
  };

  const getNurseAppointments = (nurseId) => {
    return appointments.filter((a) => a.type === 'nurse' && a.providerId === nurseId);
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        bookAppointment,
        updateAppointmentStatus,
        cancelAppointment,
        isSlotAvailable,
        getAvailableSlots,
        getPatientAppointments,
        getDoctorAppointments,
        getNurseAppointments
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
