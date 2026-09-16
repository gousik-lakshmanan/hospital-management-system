import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient'],
        message: '{VALUE} is not a valid role',
      },
      default: 'patient',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileId: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Recorded', ''],
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    postalCode: {
      type: String,
      default: '',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    bio: {
      type: String,
      default: '',
    },
    professionalDetails: {
      department: { type: String, default: '' },
      specialization: { type: String, default: '' },
      licenseNumber: { type: String, default: '' },
      experienceYears: { type: Number, default: 0 },
      qualifications: { type: String, default: '' },
      employeeId: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for full name
userSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Pre-save password hashing hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password verification instance method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe representation without sensitive attributes
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    name: `${this.firstName} ${this.lastName}`.trim(),
    email: this.email,
    phone: this.phone,
    role: this.role,
    isActive: this.isActive,
    profileId: this.profileId,
    profilePicture: this.profilePicture || '',
    dateOfBirth: this.dateOfBirth || '',
    gender: this.gender || '',
    bloodGroup: this.bloodGroup || '',
    address: this.address || '',
    city: this.city || '',
    state: this.state || '',
    postalCode: this.postalCode || '',
    emergencyContact: this.emergencyContact || { name: '', phone: '' },
    bio: this.bio || '',
    professionalDetails: this.professionalDetails || {
      department: '',
      specialization: '',
      licenseNumber: '',
      experienceYears: 0,
      qualifications: '',
      employeeId: '',
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
