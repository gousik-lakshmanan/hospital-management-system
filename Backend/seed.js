import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Patient from './src/models/Patient.js';

dotenv.config();

// Canonical project documentation credentials for MediSync AI
const SEED_USERS = [
  // 1. Administrator
  {
    firstName: 'Administrator',
    lastName: 'Admin',
    email: 'admin@medisync.local',
    phone: '9876543201',
    password: 'Admin@2026!',
    role: 'admin',
    isActive: true,
  },

  // 2. Doctor - Dr. Arun Kumar (Cardiology) - Primary & Local Alias
  {
    firstName: 'Dr. Arun',
    lastName: 'Kumar',
    email: 'arun.kumar@medisync.com',
    phone: '9876543202',
    password: 'DocArun@2026!',
    role: 'doctor',
    profileId: 'DOC001',
    isActive: true,
  },
  {
    firstName: 'Dr. Arun',
    lastName: 'Kumar',
    email: 'doctor@medisync.local',
    phone: '9876543202',
    password: 'DocArun@2026!',
    role: 'doctor',
    profileId: 'DOC001',
    isActive: true,
  },

  // 3. Doctor - Dr. Priya Sharma (General Medicine)
  {
    firstName: 'Dr. Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@medisync.com',
    phone: '9876543212',
    password: 'DocPriya@2026!',
    role: 'doctor',
    profileId: 'DOC002',
    isActive: true,
  },

  // 4. Doctor - Dr. Rahul Menon (Orthopedics)
  {
    firstName: 'Dr. Rahul',
    lastName: 'Menon',
    email: 'rahul.menon@medisync.com',
    phone: '9876543213',
    password: 'DocRahul@2026!',
    role: 'doctor',
    profileId: 'DOC003',
    isActive: true,
  },

  // 5. Doctor - Dr. Sneha Iyer (Dermatology)
  {
    firstName: 'Dr. Sneha',
    lastName: 'Iyer',
    email: 'sneha.iyer@medisync.com',
    phone: '9876543214',
    password: 'DocSneha@2026!',
    role: 'doctor',
    profileId: 'DOC004',
    isActive: true,
  },

  // 6. Nurse 1 - Nurse Anitha (General Nursing)
  {
    firstName: 'Nurse',
    lastName: 'Anitha',
    email: 'anitha@medisync.com',
    phone: '9876543221',
    password: 'NurseAnitha@2026!',
    role: 'nurse',
    profileId: 'NUR001',
    isActive: true,
  },

  // 7. Nurse 2 - Nurse Meena (Diagnostic Services)
  {
    firstName: 'Nurse',
    lastName: 'Meena',
    email: 'meena@medisync.com',
    phone: '9876543222',
    password: 'NurseMeena@2026!',
    role: 'nurse',
    profileId: 'NUR002',
    isActive: true,
  },

  // 8. Nurse 3 - Nurse Kavya (Health Screening)
  {
    firstName: 'Nurse',
    lastName: 'Kavya',
    email: 'kavya@medisync.com',
    phone: '9876543223',
    password: 'NurseKavya@2026!',
    role: 'nurse',
    profileId: 'NUR003',
    isActive: true,
  },

  // 9. Nurse 4 - Nurse Divya (Laboratory Support)
  {
    firstName: 'Nurse',
    lastName: 'Divya',
    email: 'divya@medisync.com',
    phone: '9876543224',
    password: 'NurseDivya@2026!',
    role: 'nurse',
    profileId: 'NUR004',
    isActive: true,
  },

  // 10. Nurse Alias - Staff Nurse (General Ward)
  {
    firstName: 'Staff',
    lastName: 'Nurse',
    email: 'nurse@medisync.local',
    phone: '9876543225',
    password: 'Nurse@2026!',
    role: 'nurse',
    profileId: 'NUR005',
    isActive: true,
  },

  // 11. Receptionist - Sarah Patel (Front Desk)
  {
    firstName: 'Sarah',
    lastName: 'Patel',
    email: 'receptionist@medisync.local',
    phone: '9876543204',
    password: 'Recept@2026!',
    role: 'receptionist',
    isActive: true,
  },

  // 12. Chief Pharmacist - John Miller (Pharmacy)
  {
    firstName: 'John',
    lastName: 'Miller',
    email: 'pharmacist@medisync.local',
    phone: '9876543205',
    password: 'Pharm@2026!',
    role: 'pharmacist',
    isActive: true,
  },

  // 13. Patient Documentation Account - Gousik Lakshmanan (.local & .com)
  {
    firstName: 'Gousik',
    lastName: 'Lakshmanan',
    email: 'patient@medisync.local',
    phone: '9876543206',
    password: 'Patient@2026!',
    role: 'patient',
    isActive: true,
  },
  {
    firstName: 'Gousik',
    lastName: 'Lakshmanan',
    email: 'patient@medisync.com',
    phone: '9876543207',
    password: 'Patient@2026!',
    role: 'patient',
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log(`--- Starting Documentation Credentials Seed (${SEED_USERS.length} Accounts) ---`);

    for (const userData of SEED_USERS) {
      const normalizedEmail = userData.email.toLowerCase().trim();
      let user = await User.findOne({ email: normalizedEmail });

      if (user) {
        user.firstName = userData.firstName;
        user.lastName = userData.lastName;
        user.role = userData.role;
        user.phone = userData.phone;
        user.isActive = userData.isActive;
        user.profileId = userData.profileId || null;
        user.password = userData.password; // Pre-save hook will hash this bcrypt password
        await user.save();
        console.log(`Updated user: ${normalizedEmail} [${userData.role}]`);
      } else {
        user = new User(userData);
        await user.save();
        console.log(`Created user: ${normalizedEmail} [${userData.role}]`);
      }

      // If user is patient, ensure Patient document exists with initial empty vitals
      if (user.role === 'patient') {
        let patientDoc = await Patient.findOne({ userId: user._id });
        if (!patientDoc) {
          patientDoc = new Patient({
            userId: user._id,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            phone: user.phone,
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
          await patientDoc.save();
          console.log(`Initialized Patient profile for: ${normalizedEmail}`);
        }
        user.profileId = patientDoc._id.toString();
        await user.save();
      }
    }

    console.log('--- Documentation Credentials Seed Completed Successfully ---');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedDatabase();
