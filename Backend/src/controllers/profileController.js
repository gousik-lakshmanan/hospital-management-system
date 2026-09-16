import User from '../models/User.js';
import Patient from '../models/Patient.js';

const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Recorded', ''];

/**
 * @desc    Get current authenticated user's complete profile
 * @route   GET /api/profile/me
 * @access  Private (JWT Required)
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    let patientData = null;
    if (user.role === 'patient') {
      let patient = await Patient.findOne({ userId: user._id });
      if (!patient) {
        // Ensure single consistent Patient record exists for patient account
        patient = new Patient({
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phone,
          bloodGroup: user.bloodGroup || '',
          gender: user.gender || 'Male',
          status: 'Outpatient',
          room: 'Outpatient',
          vitals: {
            temp: '',
            bp: '',
            heartRate: '',
            spo2: '',
            weight: '',
            height: '',
            bmi: '',
            bloodSugar: '',
            recordedBy: null,
            recordedByName: '',
            recordedByRole: '',
            recordedAt: null,
          },
        });
        await patient.save();
        user.profileId = patient._id.toString();
        await user.save();
      }
      patientData = patient;
    }

    return res.status(200).json({
      success: true,
      user: user.toSafeObject(),
      patient: patientData,
    });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile. ' + error.message,
    });
  }
};

/**
 * @desc    Update current authenticated user's profile information
 * @route   PUT /api/profile/me
 * @access  Private (JWT Required)
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      city,
      state,
      postalCode,
      emergencyContact,
      bio,
      professionalDetails,
    } = req.body;

    // Strict Field Validation & Whitelist Application
    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'First name cannot be empty.',
        });
      }
      user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Last name cannot be empty.',
        });
      }
      user.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth;
    }

    if (gender !== undefined) {
      if (['Male', 'Female', 'Other', ''].includes(gender)) {
        user.gender = gender;
      }
    }

    if (bloodGroup !== undefined) {
      if (!ALLOWED_BLOOD_GROUPS.includes(bloodGroup)) {
        return res.status(400).json({
          success: false,
          message: `Invalid blood group. Allowed options: ${ALLOWED_BLOOD_GROUPS.filter(Boolean).join(', ')}`,
        });
      }
      user.bloodGroup = bloodGroup;
    }

    if (address !== undefined) user.address = address.trim();
    if (city !== undefined) user.city = city.trim();
    if (state !== undefined) user.state = state.trim();
    if (postalCode !== undefined) user.postalCode = postalCode.trim();
    if (bio !== undefined) user.bio = bio.trim();

    if (emergencyContact !== undefined && typeof emergencyContact === 'object') {
      user.emergencyContact = {
        name: emergencyContact.name ? emergencyContact.name.trim() : user.emergencyContact?.name || '',
        phone: emergencyContact.phone ? emergencyContact.phone.trim() : user.emergencyContact?.phone || '',
      };
    }

    // Role-specific professional details (Staff roles)
    if (professionalDetails !== undefined && typeof professionalDetails === 'object' && user.role !== 'patient') {
      user.professionalDetails = {
        department: professionalDetails.department !== undefined ? professionalDetails.department.trim() : user.professionalDetails?.department || '',
        specialization: professionalDetails.specialization !== undefined ? professionalDetails.specialization.trim() : user.professionalDetails?.specialization || '',
        licenseNumber: professionalDetails.licenseNumber !== undefined ? professionalDetails.licenseNumber.trim() : user.professionalDetails?.licenseNumber || '',
        experienceYears: professionalDetails.experienceYears !== undefined ? Number(professionalDetails.experienceYears) || 0 : user.professionalDetails?.experienceYears || 0,
        qualifications: professionalDetails.qualifications !== undefined ? professionalDetails.qualifications.trim() : user.professionalDetails?.qualifications || '',
        employeeId: professionalDetails.employeeId !== undefined ? professionalDetails.employeeId.trim() : user.professionalDetails?.employeeId || '',
      };
    }

    await user.save();

    // Synchronize Patient model if role is patient
    let patientDoc = null;
    if (user.role === 'patient') {
      patientDoc = await Patient.findOne({ userId: user._id });
      if (!patientDoc) {
        patientDoc = new Patient({
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phone,
          bloodGroup: user.bloodGroup || '',
          gender: user.gender || 'Male',
          status: 'Outpatient',
          room: 'Outpatient',
        });
      } else {
        patientDoc.name = `${user.firstName} ${user.lastName}`.trim();
        patientDoc.phone = user.phone;
        if (user.gender) patientDoc.gender = user.gender;
        if (user.bloodGroup !== undefined) patientDoc.bloodGroup = user.bloodGroup;
      }
      await patientDoc.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toSafeObject(),
      patient: patientDoc,
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile. ' + error.message,
    });
  }
};

/**
 * @desc    Upload or update current authenticated user's profile picture
 * @route   PUT /api/profile/me/picture
 * @access  Private (JWT Required)
 */
export const updateProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const { profilePicture } = req.body;

    if (!profilePicture || typeof profilePicture !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Profile picture data is required.',
      });
    }

    // Validate MIME type & structure
    const isDataUri = /^data:image\/(jpeg|jpg|png|webp);base64,/.test(profilePicture);
    const isHttpUrl = /^https?:\/\//.test(profilePicture);

    if (!isDataUri && !isHttpUrl) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture must be a valid JPG, PNG, or WEBP image format.',
      });
    }

    // Validate payload size (Max 2MB binary -> ~2.8MB base64)
    if (isDataUri) {
      const base64Content = profilePicture.split(',')[1] || '';
      const approximateSizeBytes = (base64Content.length * 3) / 4;
      const MAX_BYTES = 2 * 1024 * 1024; // 2 MB limit

      if (approximateSizeBytes > MAX_BYTES) {
        return res.status(400).json({
          success: false,
          message: 'Profile picture file size must not exceed 2 MB.',
        });
      }
    }

    user.profilePicture = profilePicture;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully.',
      profilePicture: user.profilePicture,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('updateProfilePicture error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile picture. ' + error.message,
    });
  }
};
