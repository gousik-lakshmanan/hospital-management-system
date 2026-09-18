import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';

/**
 * @desc    Get active provider list (Doctors and Nurses) for booking options
 * @route   GET /api/appointments/providers
 * @access  Private (Authenticated users)
 */
export const getProviders = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('firstName lastName email role professionalDetails isActive')
      .sort({ firstName: 1 });

    const nurses = await User.find({ role: 'nurse', isActive: true })
      .select('firstName lastName email role professionalDetails isActive')
      .sort({ firstName: 1 });

    const mappedDoctors = doctors.map((d) => ({
      _id: d._id.toString(),
      id: d._id.toString(),
      name: `${d.firstName} ${d.lastName}`.trim(),
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      role: d.role,
      isActive: d.isActive,
      department: d.professionalDetails?.department || 'General Medicine',
      specialization: d.professionalDetails?.specialization || '',
      room: d.professionalDetails?.employeeId || '',
    }));

    const mappedNurses = nurses.map((n) => ({
      _id: n._id.toString(),
      id: n._id.toString(),
      name: `${n.firstName} ${n.lastName}`.trim(),
      firstName: n.firstName,
      lastName: n.lastName,
      email: n.email,
      role: n.role,
      isActive: n.isActive,
      department: n.professionalDetails?.department || 'General Nursing',
      specialization: n.professionalDetails?.specialization || '',
      shift: n.professionalDetails?.specialization || 'General Duty',
    }));

    return res.status(200).json({
      success: true,
      doctors: mappedDoctors,
      nurses: mappedNurses,
      providers: [...mappedDoctors, ...mappedNurses],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Book a new doctor or nurse appointment
 * @route   POST /api/appointments
 * @access  Private (Patient only)
 */
export const bookAppointment = async (req, res, next) => {
  try {
    // 1. Verify authenticated user role
    if (req.user.role !== 'patient' && req.user.role !== 'admin' && req.user.role !== 'receptionist') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can book appointment requests.',
      });
    }

    const {
      type: rawType,
      providerId,
      date,
      time,
      service,
      reason,
      notes = '',
    } = req.body;

    // 2. Validate provider ID
    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid provider identifier.',
      });
    }

    // 3. Validate date and time
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Both appointment date and time are required.',
      });
    }

    // 4. Server-side provider verification from MongoDB User collection
    const provider = await User.findOne({
      _id: providerId,
      isActive: true,
    });

    if (!provider || !['doctor', 'nurse'].includes(provider.role)) {
      return res.status(404).json({
        success: false,
        message: 'The selected healthcare provider was not found or is currently inactive.',
      });
    }

    const type = rawType || provider.role;
    if (type !== provider.role) {
      return res.status(400).json({
        success: false,
        message: `Provider role mismatch. Expected a ${type}, but provider is a ${provider.role}.`,
      });
    }

    // 6. Server-side derive patient identity from JWT authenticated user
    const patientId = req.user._id;
    const patientName = `${req.user.firstName} ${req.user.lastName}`.trim();
    const patientEmail = req.user.email;

    // 7. Server-side derive provider identity
    const providerName = `${provider.firstName} ${provider.lastName}`.trim();
    const assignedDepartment =
      provider.professionalDetails?.department ||
      (type === 'doctor' ? 'General Medicine' : 'General Nursing');
    const assignedService =
      type === 'doctor' ? 'Consultation' : service || 'General Diagnostic Check';
    const assignedReason = reason ? reason.trim() : (type === 'doctor' ? 'Clinical Consultation' : assignedService);

    // 8. Strict Provider Scheduling Conflict Check (active statuses)
    const slotConflict = await Appointment.findOne({
      providerId: provider._id,
      date: date.trim(),
      time: time.trim(),
      status: { $in: ['Pending', 'Confirmed', 'Rescheduled'] },
    });

    if (slotConflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked for the selected provider. Please choose another time.',
      });
    }

    // 9. Duplicate Request Prevention for the same patient
    const duplicateRequest = await Appointment.findOne({
      patientId,
      providerId: provider._id,
      date: date.trim(),
      time: time.trim(),
      status: { $in: ['Pending', 'Confirmed', 'Rescheduled'] },
    });

    if (duplicateRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active appointment request with this provider at the selected date and time.',
      });
    }

    // 10. Create and persist Appointment in MongoDB
    const newAppointment = new Appointment({
      type,
      patientId,
      patientName,
      patientEmail,
      providerId: provider._id,
      providerName,
      department: assignedDepartment,
      service: assignedService,
      reason: assignedReason,
      date: date.trim(),
      time: time.trim(),
      status: 'Pending',
      requestedAt: new Date(),
      respondedAt: null,
      notes: notes ? notes.trim() : '',
    });

    await newAppointment.save();

    // Notify assigned doctor or nurse
    await notificationService.createNotification({
      recipientId: provider._id,
      recipientRole: provider.role,
      type: 'APPOINTMENT',
      title: `New ${type === 'doctor' ? 'Doctor' : 'Nurse'} Appointment Request`,
      message: `New appointment request from ${patientName} for ${date} at ${time}.`,
      entityType: 'Appointment',
      entityId: newAppointment._id,
      priority: 'NORMAL',
      dedupeKey: `appt-req-${newAppointment._id}`
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully. Pending provider confirmation.',
      appointment: newAppointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments for the logged-in patient
 * @route   GET /api/appointments/my
 * @access  Private (Patient)
 */
export const getMyAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { patientId: req.user._id };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query).sort({ date: -1, time: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments assigned to the logged-in doctor
 * @route   GET /api/appointments/doctor
 * @access  Private (Doctor)
 */
export const getDoctorAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {
      providerId: req.user._id,
      type: 'doctor',
    };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query).sort({ date: -1, time: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments assigned to the logged-in nurse
 * @route   GET /api/appointments/nurse
 * @access  Private (Nurse)
 */
export const getNurseAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {
      providerId: req.user._id,
      type: 'nurse',
    };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query).sort({ date: -1, time: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all appointments (Hospital Wide)
 * @route   GET /api/appointments
 * @access  Private (Admin, Receptionist)
 */
export const getAllAppointments = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const appointments = await Appointment.find(query).sort({ date: -1, time: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment status (Accept, Reject, Conclude, or Patient Cancel)
 * @route   PATCH /api/appointments/:id/status
 * @access  Private
 */
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Target status is required.',
      });
    }

    const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'Rejected', 'Rescheduled', 'Completed', 'Cancelled'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${status}. Allowed: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    let appointment = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      appointment = await Appointment.findById(id);
    }
    if (!appointment) {
      appointment = await Appointment.findOne({ id });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment record not found.',
      });
    }

    const isPatientOwner = appointment.patientId.toString() === req.user._id.toString();
    const isProviderOwner = appointment.providerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // 1. Authorization checks
    if (req.user.role === 'patient') {
      if (!isPatientOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You cannot modify another patient\'s appointment.',
        });
      }
      if (status !== 'Cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Patients are only permitted to cancel their own appointments.',
        });
      }
      if (['Completed', 'Cancelled', 'Rejected'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel an appointment that is already ${appointment.status.toLowerCase()}.`,
        });
      }
    } else if (req.user.role === 'doctor') {
      if (!isProviderOwner || appointment.type !== 'doctor') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only manage doctor appointments assigned directly to you.',
        });
      }
    } else if (req.user.role === 'nurse') {
      if (!isProviderOwner || appointment.type !== 'nurse') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only manage nurse appointments assigned directly to you.',
        });
      }
    } else if (!isAdmin && req.user.role !== 'receptionist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify appointments.',
      });
    }

    // 2. Lifecycle Status Transitions
    if (isProviderOwner || isAdmin) {
      // Terminal status protection
      if (['Completed', 'Cancelled', 'Rejected'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status of an appointment that is already ${appointment.status}.`,
        });
      }

      if (status === 'Confirmed' && appointment.status !== 'Pending' && appointment.status !== 'Rescheduled') {
        return res.status(400).json({
          success: false,
          message: `Cannot confirm an appointment with current status: ${appointment.status}.`,
        });
      }

      if (status === 'Rejected' && appointment.status !== 'Pending' && appointment.status !== 'Rescheduled') {
        return res.status(400).json({
          success: false,
          message: `Cannot reject an appointment with current status: ${appointment.status}.`,
        });
      }

      if (status === 'Completed' && appointment.status !== 'Confirmed' && appointment.status !== 'Rescheduled') {
        return res.status(400).json({
          success: false,
          message: 'Only Confirmed or Rescheduled appointments can be marked as Completed.',
        });
      }
    }

    // 3. Apply updates
    appointment.status = status;
    appointment.respondedAt = new Date();
    if (notes) {
      appointment.notes = appointment.notes ? `${appointment.notes} | ${notes.trim()}` : notes.trim();
    }

    await appointment.save();

    // Notify patient of status update
    if (status === 'Confirmed') {
      await notificationService.createNotification({
        recipientId: appointment.patientId,
        recipientRole: 'patient',
        type: 'APPOINTMENT',
        title: 'Appointment Confirmed',
        message: `Your appointment with ${appointment.providerName} on ${appointment.date} at ${appointment.time} is confirmed.`,
        entityType: 'Appointment',
        entityId: appointment._id,
        priority: 'NORMAL',
        dedupeKey: `appt-conf-${appointment._id}`
      });
    } else if (status === 'Rejected') {
      await notificationService.createNotification({
        recipientId: appointment.patientId,
        recipientRole: 'patient',
        type: 'APPOINTMENT',
        title: 'Appointment Declined',
        message: `Your appointment request with ${appointment.providerName} was declined${notes ? ': ' + notes : '.'}`,
        entityType: 'Appointment',
        entityId: appointment._id,
        priority: 'NORMAL',
        dedupeKey: `appt-rej-${appointment._id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Appointment status successfully updated to ${appointment.status}.`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reschedule appointment date/time with conflict validation
 * @route   PATCH /api/appointments/:id/reschedule
 * @access  Private (Provider / Admin)
 */
export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, time, notes } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both new appointment date and time.',
      });
    }

    let appointment = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      appointment = await Appointment.findById(id);
    }
    if (!appointment) {
      appointment = await Appointment.findOne({ id });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment record not found.',
      });
    }

    const isProviderOwner = appointment.providerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isProviderOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only reschedule appointments assigned to you.',
      });
    }

    if (['Completed', 'Cancelled', 'Rejected'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule an appointment that is already ${appointment.status}.`,
      });
    }

    // Re-verify Provider Scheduling Conflict for the new date/time
    const slotConflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      providerId: appointment.providerId,
      date: date.trim(),
      time: time.trim(),
      status: { $in: ['Pending', 'Confirmed', 'Rescheduled'] },
    });

    if (slotConflict) {
      return res.status(409).json({
        success: false,
        message: 'The requested reschedule slot is already occupied. Please choose another date or time.',
      });
    }

    // Apply updates
    appointment.date = date.trim();
    appointment.time = time.trim();
    appointment.status = 'Rescheduled';
    appointment.respondedAt = new Date();
    if (notes) {
      appointment.notes = appointment.notes ? `${appointment.notes} | ${notes.trim()}` : notes.trim();
    }

    await appointment.save();

    // Notify patient of rescheduled appointment
    await notificationService.createNotification({
      recipientId: appointment.patientId,
      recipientRole: 'patient',
      type: 'APPOINTMENT',
      title: 'Appointment Rescheduled',
      message: `Your appointment with ${appointment.providerName} has been rescheduled to ${appointment.date} at ${appointment.time}.`,
      entityType: 'Appointment',
      entityId: appointment._id,
      priority: 'NORMAL',
      dedupeKey: `appt-resched-${appointment._id}-${appointment.date}-${appointment.time}`
    });

    return res.status(200).json({
      success: true,
      message: `Appointment successfully rescheduled to ${appointment.date} at ${appointment.time}.`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getProviders,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getNurseAppointments,
  getAllAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
};
