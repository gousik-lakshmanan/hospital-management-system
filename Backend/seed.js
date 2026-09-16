import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';

dotenv.config();

const SEED_USERS = [
  // Canonical 6-role development accounts (as specified in requirements)
  {
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@medisync.local',
    phone: '9876543201',
    password: 'MediSync@123',
    role: 'admin',
    isActive: true,
  },
  {
    firstName: 'Dr. Arun',
    lastName: 'Kumar',
    email: 'doctor@medisync.local',
    phone: '9876543202',
    password: 'MediSync@123',
    role: 'doctor',
    isActive: true,
  },
  {
    firstName: 'Nurse',
    lastName: 'Anitha',
    email: 'nurse@medisync.local',
    phone: '9876543203',
    password: 'MediSync@123',
    role: 'nurse',
    isActive: true,
  },
  {
    firstName: 'Sarah',
    lastName: 'Patel',
    email: 'receptionist@medisync.local',
    phone: '9876543204',
    password: 'MediSync@123',
    role: 'receptionist',
    isActive: true,
  },
  {
    firstName: 'John',
    lastName: 'Miller',
    email: 'pharmacist@medisync.local',
    phone: '9876543205',
    password: 'MediSync@123',
    role: 'pharmacist',
    isActive: true,
  },
  {
    firstName: 'Gousik',
    lastName: 'Lakshmanan',
    email: 'patient@medisync.local',
    phone: '9876543206',
    password: 'MediSync@123',
    role: 'patient',
    isActive: true,
  },

  // Frontend demo accounts (.com domain) for seamless UI demo button integration
  {
    firstName: 'Gousik',
    lastName: 'Administrator',
    email: 'admin@medisync.com',
    phone: '9876543211',
    password: 'MediSync@123',
    role: 'admin',
    isActive: true,
  },
  {
    firstName: 'Dr. Arun',
    lastName: 'Kumar',
    email: 'arun.kumar@medisync.com',
    phone: '9876543212',
    password: 'MediSync@123',
    role: 'doctor',
    isActive: true,
  },
  {
    firstName: 'Dr. Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@medisync.com',
    phone: '9876543213',
    password: 'MediSync@123',
    role: 'doctor',
    isActive: true,
  },
  {
    firstName: 'Dr. Rahul',
    lastName: 'Menon',
    email: 'rahul.menon@medisync.com',
    phone: '9876543214',
    password: 'MediSync@123',
    role: 'doctor',
    isActive: true,
  },
  {
    firstName: 'Dr. Sneha',
    lastName: 'Iyer',
    email: 'sneha.iyer@medisync.com',
    phone: '9876543215',
    password: 'MediSync@123',
    role: 'doctor',
    isActive: true,
  },
  {
    firstName: 'Dr. Arun',
    lastName: 'Kumar',
    email: 'doctor@medisync.com',
    phone: '9876543216',
    password: 'MediSync@123',
    role: 'doctor',
    isActive: true,
  },
  {
    firstName: 'Nurse',
    lastName: 'Anitha',
    email: 'anitha@medisync.com',
    phone: '9876543221',
    password: 'MediSync@123',
    role: 'nurse',
    isActive: true,
  },
  {
    firstName: 'Nurse',
    lastName: 'Meena',
    email: 'meena@medisync.com',
    phone: '9876543222',
    password: 'MediSync@123',
    role: 'nurse',
    isActive: true,
  },
  {
    firstName: 'Nurse',
    lastName: 'Kavya',
    email: 'kavya@medisync.com',
    phone: '9876543223',
    password: 'MediSync@123',
    role: 'nurse',
    isActive: true,
  },
  {
    firstName: 'Nurse',
    lastName: 'Divya',
    email: 'divya@medisync.com',
    phone: '9876543224',
    password: 'MediSync@123',
    role: 'nurse',
    isActive: true,
  },
  {
    firstName: 'Nurse',
    lastName: 'Anitha',
    email: 'nurse@medisync.com',
    phone: '9876543225',
    password: 'MediSync@123',
    role: 'nurse',
    isActive: true,
  },
  {
    firstName: 'Sarah',
    lastName: 'Patel',
    email: 'receptionist@medisync.com',
    phone: '9876543231',
    password: 'MediSync@123',
    role: 'receptionist',
    isActive: true,
  },
  {
    firstName: 'John',
    lastName: 'Miller',
    email: 'pharmacist@medisync.com',
    phone: '9876543241',
    password: 'MediSync@123',
    role: 'pharmacist',
    isActive: true,
  },
  {
    firstName: 'Gousik',
    lastName: 'Lakshmanan',
    email: 'patient@medisync.com',
    phone: '9876543251',
    password: 'MediSync@123',
    role: 'patient',
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('--- Starting Development Seed ---');

    for (const userData of SEED_USERS) {
      const normalizedEmail = userData.email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail });

      if (existing) {
        existing.firstName = userData.firstName;
        existing.lastName = userData.lastName;
        existing.role = userData.role;
        existing.phone = userData.phone;
        existing.isActive = userData.isActive;
        existing.password = userData.password; // Triggers pre-save bcrypt hash
        await existing.save();
        console.log(`Updated user: ${normalizedEmail} [${userData.role}]`);
      } else {
        const newUser = new User(userData);
        await newUser.save();
        console.log(`Created user: ${normalizedEmail} [${userData.role}]`);
      }
    }

    console.log('--- Development Seed Completed Successfully ---');
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
