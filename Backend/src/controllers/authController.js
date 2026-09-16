import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

const ALLOWED_ROLES = ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient'];

// @desc    Register a new user account (6 personas supported)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

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

    const assignedRole = role ? role.toLowerCase().trim() : 'patient';
    if (!ALLOWED_ROLES.includes(assignedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role selected. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      password,
      role: assignedRole,
      isActive: true,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser._id.toString(),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        name: `${newUser.firstName} ${newUser.lastName}`.trim(),
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email including the password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'This account has been deactivated. Please contact administrator.',
      });
    }

    // Verify password via bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private (Authenticated users)
export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out current session
// @route   POST /api/auth/logout
// @access  Public / Private
export const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    RBAC verification test endpoint
// @route   GET /api/auth/admin-test
// @access  Private (Admin only)
export const adminTest = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: `Admin access granted. Welcome, ${req.user.name}!`,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getMe,
  logout,
  adminTest,
};
