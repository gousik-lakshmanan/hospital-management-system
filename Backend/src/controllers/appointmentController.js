import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// Helper to resolve provider User in MongoDB
const resolveProvider = async (type, providerId, department, service) => {
  let provider = null;

  // 1. Try finding by MongoDB ObjectId
  if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
    provider = await User.findOne({ _id: providerId, role: type, isActive: true });
  }

  // 2. Try finding by profileId (e.g. DOC001, NUR001)
  if (!provider && providerId) {
    provider = await User.findOne({ profileId: providerId, role: type, isActive: true });
  }

  // 3. Fallback: department / email mappings if provided
  if (!provider && type === 'doctor') {
    if (department && department.toLowerCase().includes('cardio')) {
      provider = await User.findOne({ email: 'doctor@medisync.local', role: 'doctor' }) ||
                 await User.findOne({ email: 'arun.kumar@medisync.com', role: 'doctor' });
    } else if (department && department.toLowerCase().includes('general')) {
      provider = await User.findOne({ email: 'priya.sharma@medisync.com', role: 'doctor' });
    } else if (department && department.toLowerCase().includes('ortho')) {
      provider = await User.findOne({ email: 'rahul.menon@medisync.com', role: 'doctor' });
    } else if (department && department.toLowerCase().includes('derma')) {
      provider = await User.findOne({ email: 'sneha.iyer@medisync.com', role: 'doctor' });
    }
  }

  if (!provider && type === 'nurse') {
    if (service && service.toLowerCase().includes('pressure')) {
      provider = await User.findOne({ email: 'meena@medisync.com', role: 'nurse' });
    } else if (service && service.toLowerCase().includes('screen')) {
      provider = await User.findOne({ email: 'kavya@medisync.com', role: 'nurse' });
    } else if (service && service.toLowerCase().includes('blood') || service?.toLowerCase().includes('sample')) {
      provider = await User.findOne({ email: 'divya@medisync.com', role: 'nurse' });
    } else {
      provider = await User.findOne({ email: 'anitha@medisync.com', role: 'nurse' }) ||
                 await User.findOne({ email: 'nurse@medisync.local', role: 'nurse' });
    }
  }

  // 4. Default fallback: any active user with that role
  if (!provider) {
    provider = await User.findOne({ role: type, isActive: true });
  }

  return provider;
};

// @desc    Get active provider list (Doctors and Nurses) for booking options
// @route   GET /api/appointments/providers
// @access  Private
export const getProviders = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true }).select('firstName lastName email profileId role');
    const nurses = await User.find({ role: 'nurse', isActive: true }).select('firstName lastName email profileId role');

    return res.status(200).json({
      success: true,
      doctors: doctors.map((d) => ({
        id: d._id.toString(),
        name: `${d.firstName} ${d.lastName}`.trim(),
        email: d.email,
        profileId: d.profileId,
        role: d.role,
      })),
      nurses: nurses.map((n) => ({
        id: n._id.toString(),
        name: `${n.firstName} ${n.lastName}`.trim(),
        email: n.email,
        profileId: n.profileId,
        role: n.role,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a new doctor or nurse appointment
// @route   POST /api/appointments
// @access  Private (Patient, Admin, Receptionist)
export const bookAppointment = async (req, res, next) => {
  try {
    const {
      type = 'doctor',
      providerId,
      department,
      service,
      reason = 'Consultation',
      date,
      time,
      notes = '',
    } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both appointment date and time.',
      });
    }

    const apptType = type === 'nurse' ? 'nurse' : 'doctor';

    // Resolve Provider User
    const provider = await resolveProvider(apptType, providerId, department, service);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: `No active ${apptType} found for the requested booking.`,
      });
    }

    // Patient identity is derived securely from JWT
    const patientUserId = req.user._id;
    const patientName = req.user.name || `${req.user.firstName} ${req.user.lastName}`.trim();
    const patientEmail = req.user.email;

    const assignedDepartment = department || (apptType === 'doctor' ? 'General Medicine' : 'General Nursing');
    const assignedService = service || (apptType === 'doctor' ? 'Consultation' : 'General Checkup');

    // Create Appointment in MongoDB
    const newAppointment = new Appointment({
      type: apptType,
      patientId: patientUserId,
      patientName,
      patientEmail,
      providerId: provider._id,
      providerName: provider.name || `${provider.firstName} ${provider.lastName}`.trim(),
      department: assignedDepartment,
      service: assignedService,
      reason,
      date,
      time,
      status: 'Scheduled',
      notes,
    });

    await newAppointment.save();

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: newAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments for the logged-in patient
// @route   GET /api/appointments/my
// @access  Private (Patient)
export const getMyAppointments = async (req, res, next) => {
  try {
    // STRICT OWNER QUERY: patientId = req.user._id
    const appointments = await Appointment.find({ patientId: req.user._id }).sort({ date: -1, time: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments assigned to the logged-in doctor
// @route   GET /api/appointments/doctor
// @access  Private (Doctor)
export const getDoctorAppointments = async (req, res, next) => {
  try {
    // STRICT OWNER QUERY: providerId = req.user._id AND type = 'doctor'
    const appointments = await Appointment.find({
      providerId: req.user._id,
      type: 'doctor',
    }).sort({ date: -1, time: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments assigned to the logged-in nurse
// @route   GET /api/appointments/nurse
// @access  Private (Nurse)
export const getNurseAppointments = async (req, res, next) => {
  try {
    // STRICT OWNER QUERY: providerId = req.user._id AND type = 'nurse'
    const appointments = await Appointment.find({
      providerId: req.user._id,
      type: 'nurse',
    }).sort({ date: -1, time: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments (Hospital Wide)
// @route   GET /api/appointments
// @access  Private (Admin, Receptionist)
export const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find().sort({ date: -1, time: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    let appointment = await Appointment.findById(id);
    if (!appointment) {
      appointment = await Appointment.findOne({ id });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Authorization check
    const isPatientOwner = appointment.patientId.toString() === req.user._id.toString();
    const isProviderOwner = appointment.providerId.toString() === req.user._id.toString();
    const isStaff = ['admin', 'receptionist'].includes(req.user.role);

    if (!isPatientOwner && !isProviderOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this appointment',
      });
    }

    // Patient can only cancel their own appointment
    if (isPatientOwner && !isProviderOwner && !isStaff && status !== 'Cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Patients can only cancel appointments',
      });
    }

    if (status) {
      appointment.status = status;
    }
    if (notes) {
      appointment.notes = appointment.notes ? `${appointment.notes} | ${notes}` : notes;
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${appointment.status}`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule appointment date/time
// @route   PATCH /api/appointments/:id/reschedule
// @access  Private
export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, time, notes } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both new date and time',
      });
    }

    let appointment = await Appointment.findById(id);
    if (!appointment) {
      appointment = await Appointment.findOne({ id });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    appointment.date = date;
    appointment.time = time;
    appointment.status = 'Rescheduled';
    if (notes) {
      appointment.notes = appointment.notes ? `${appointment.notes} | ${notes}` : notes;
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};
