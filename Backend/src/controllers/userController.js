import User from '../models/User.js';

/**
 * @desc    Admin creates a new Doctor account
 * @route   POST /api/users/doctors
 * @access  Private (Admin only)
 */
export const createDoctor = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      specialization,
      room,
      licenseNumber,
      experienceYears,
      qualifications,
      bio,
    } = req.body;

    // Required Field Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Application-level unique email check
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const newDoctor = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: 'doctor',
      isActive: true,
      bio: bio ? bio.trim() : '',
      professionalDetails: {
        department: department ? department.trim() : 'General Medicine',
        specialization: specialization ? specialization.trim() : '',
        licenseNumber: licenseNumber ? licenseNumber.trim() : '',
        experienceYears: experienceYears ? Number(experienceYears) || 0 : 0,
        qualifications: qualifications ? qualifications.trim() : '',
        employeeId: room ? `Room ${room.trim()}` : '',
      },
    });

    await newDoctor.save();

    return res.status(201).json({
      success: true,
      message: 'Doctor account created successfully',
      user: newDoctor.toSafeObject(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Admin creates a new Nurse account
 * @route   POST /api/users/nurses
 * @access  Private (Admin only)
 */
export const createNurse = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      shift,
      licenseNumber,
      experienceYears,
      qualifications,
      bio,
    } = req.body;

    // Required Field Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Application-level unique email check
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const newNurse = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: 'nurse',
      isActive: true,
      bio: bio ? bio.trim() : '',
      professionalDetails: {
        department: department ? department.trim() : 'General Ward',
        specialization: shift ? `${shift.trim()} Shift` : '',
        licenseNumber: licenseNumber ? licenseNumber.trim() : '',
        experienceYears: experienceYears ? Number(experienceYears) || 0 : 0,
        qualifications: qualifications ? qualifications.trim() : '',
      },
    });

    await newNurse.save();

    return res.status(201).json({
      success: true,
      message: 'Nursing staff account created successfully',
      user: newNurse.toSafeObject(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get list of active doctors
 * @route   GET /api/users/doctors
 * @access  Private (Authenticated users)
 */
export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    const safeDoctors = doctors.map((doc) => ({
      id: doc._id.toString(),
      name: `${doc.firstName} ${doc.lastName}`.trim(),
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phone: doc.phone,
      department: doc.professionalDetails?.department || 'General Medicine',
      specialization: doc.professionalDetails?.specialization || 'General',
      room: doc.professionalDetails?.employeeId || 'Consultation Room A',
      status: doc.isActive ? 'On Duty' : 'Off Duty',
      appointmentsCount: 0,
    }));

    return res.status(200).json({
      success: true,
      doctors: safeDoctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of active nurses
 * @route   GET /api/users/nurses
 * @access  Private (Authenticated users)
 */
export const getNurses = async (req, res, next) => {
  try {
    const nurses = await User.find({ role: 'nurse', isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    const safeNurses = nurses.map((n) => ({
      id: n._id.toString(),
      name: `${n.firstName} ${n.lastName}`.trim(),
      firstName: n.firstName,
      lastName: n.lastName,
      email: n.email,
      phone: n.phone,
      department: n.professionalDetails?.department || 'General Ward',
      shift: n.professionalDetails?.specialization || 'Morning Shift',
      status: n.isActive ? 'On Duty' : 'Off Duty',
    }));

    return res.status(200).json({
      success: true,
      nurses: safeNurses,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createDoctor,
  createNurse,
  getDoctors,
  getNurses,
};
