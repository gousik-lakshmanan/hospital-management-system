import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

// @desc    Get logged-in patient's own profile and vitals
// @route   GET /api/patients/me
// @access  Private (Patient)
export const getMyPatientProfile = async (req, res, next) => {
  try {
    let patient = await Patient.findOne({ userId: req.user._id });

    // Auto-create patient profile with empty vitals if not existing
    if (!patient) {
      patient = new Patient({
        userId: req.user._id,
        name: req.user.name || `${req.user.firstName} ${req.user.lastName}`.trim(),
        email: req.user.email,
        phone: req.user.phone || '',
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

      // Update user.profileId
      req.user.profileId = patient._id.toString();
      await req.user.save();
    }

    return res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admin, Doctor, Nurse, Receptionist)
export const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient by ID or userId
// @route   GET /api/patients/:id
// @access  Private
export const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if patient is fetching their own profile or staff is accessing
    let patient = await Patient.findById(id);
    if (!patient) {
      patient = await Patient.findOne({ userId: id });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    // If requester is a patient, they can only view their own profile
    if (req.user.role === 'patient' && patient.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own patient profile.',
      });
    }

    return res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record/Update patient vitals
// @route   PUT /api/patients/:id/vitals
// @access  Private (NURSE ONLY)
export const updatePatientVitals = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { temp, bp, heartRate, spo2, weight, height, bmi, bloodSugar } = req.body;

    // Verify patient existence (lookup by MongoDB _id or userId)
    let patient = await Patient.findById(id);
    if (!patient) {
      patient = await Patient.findOne({ userId: id });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    // Server-side audit logging of recorder
    const updatedVitals = {
      temp: temp !== undefined ? String(temp).trim() : patient.vitals?.temp || '',
      bp: bp !== undefined ? String(bp).trim() : patient.vitals?.bp || '',
      heartRate: heartRate !== undefined ? String(heartRate).trim() : patient.vitals?.heartRate || '',
      spo2: spo2 !== undefined ? String(spo2).trim() : patient.vitals?.spo2 || '',
      weight: weight !== undefined ? String(weight).trim() : patient.vitals?.weight || '',
      height: height !== undefined ? String(height).trim() : patient.vitals?.height || '',
      bmi: bmi !== undefined ? String(bmi).trim() : patient.vitals?.bmi || '',
      bloodSugar: bloodSugar !== undefined ? String(bloodSugar).trim() : patient.vitals?.bloodSugar || '',
      recordedBy: req.user._id,
      recordedByName: req.user.name || `${req.user.firstName} ${req.user.lastName}`.trim(),
      recordedByRole: req.user.role,
      recordedAt: new Date(),
    };

    patient.vitals = updatedVitals;
    await patient.save();

    return res.status(200).json({
      success: true,
      message: 'Patient vitals successfully recorded by nursing staff',
      vitals: patient.vitals,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a patient clinical directory record
// @route   POST /api/patients
// @access  Private (Admin, Receptionist)
export const createPatient = async (req, res, next) => {
  try {
    const { name, age, gender, bloodGroup, phone, email, room, medicalHistory } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Patient name is required',
      });
    }

    // Check if a user exists with this email
    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    const newPatient = new Patient({
      userId: user ? user._id : new mongoose.Types.ObjectId(),
      name: name.trim(),
      age: Number(age) || 0,
      gender: gender || 'Male',
      bloodGroup: bloodGroup || '',
      phone: phone ? phone.trim() : '',
      email: email ? email.toLowerCase().trim() : '',
      room: room || 'Outpatient',
      status: 'Outpatient',
      medicalHistory: medicalHistory || [],
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

    await newPatient.save();

    if (user && !user.profileId) {
      user.profileId = newPatient._id.toString();
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Patient clinical record created successfully',
      patient: newPatient,
    });
  } catch (error) {
    next(error);
  }
};
