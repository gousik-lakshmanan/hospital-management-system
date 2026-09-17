import mongoose from 'mongoose';
import BloodStock, { ALLOWED_BLOOD_GROUPS } from '../models/BloodStock.js';
import BloodDonor from '../models/BloodDonor.js';
import User from '../models/User.js';

// Initial baseline demo seed quantities (Development/Demo values)
const INITIAL_BLOOD_STOCK = [
  { bloodGroup: 'A+', units: 12 },
  { bloodGroup: 'A-', units: 5 },
  { bloodGroup: 'B+', units: 10 },
  { bloodGroup: 'B-', units: 4 },
  { bloodGroup: 'AB+', units: 6 },
  { bloodGroup: 'AB-', units: 3 },
  { bloodGroup: 'O+', units: 15 },
  { bloodGroup: 'O-', units: 5 },
];

const INITIAL_DONORS = [
  {
    name: 'Arun Kumar',
    age: 28,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+91 94444 11111',
    email: 'arun.donor@medisync.ai',
    address: '12 Anna Nagar, Chennai',
    totalDonations: 3,
    lastDonationDate: new Date('2026-06-12'),
  },
  {
    name: 'Priya Sharma',
    age: 31,
    gender: 'Female',
    bloodGroup: 'A+',
    phone: '+91 94444 22222',
    email: 'priya.donor@medisync.ai',
    address: '45 Indiranagar, Bengaluru',
    totalDonations: 2,
    lastDonationDate: new Date('2026-07-20'),
  },
  {
    name: 'Rahul Kumar',
    age: 26,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+91 94444 33333',
    email: 'rahul.donor@medisync.ai',
    address: '78 T Nagar, Chennai',
    totalDonations: 4,
    lastDonationDate: new Date('2026-05-18'),
  },
  {
    name: 'Meena Devi',
    age: 34,
    gender: 'Female',
    bloodGroup: 'AB+',
    phone: '+91 94444 44444',
    email: 'meena.donor@medisync.ai',
    address: '90 Jubilee Hills, Hyderabad',
    totalDonations: 1,
    lastDonationDate: new Date('2026-08-01'),
  },
];

export const seedBloodBank = async () => {
  try {
    // 1. Locate an admin user for audit references
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.findOne();
    }
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();
    const adminName = adminUser
      ? `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || 'Administrator'
      : 'Administrator';

    // 2. Idempotently Seed 8 Blood Stock records using $setOnInsert (Preserving live inventory on restarts)
    let stockUpserted = 0;
    for (const item of INITIAL_BLOOD_STOCK) {
      const result = await BloodStock.findOneAndUpdate(
        { bloodGroup: item.bloodGroup },
        {
          $setOnInsert: {
            bloodGroup: item.bloodGroup,
            units: item.units,
            updatedBy: adminId,
          },
        },
        { upsert: true, new: true }
      );
      if (result) stockUpserted++;
    }

    // 3. Idempotently Seed Blood Donors (matching on phone number)
    let donorsUpserted = 0;
    for (const donor of INITIAL_DONORS) {
      await BloodDonor.findOneAndUpdate(
        { phone: donor.phone },
        {
          $setOnInsert: {
            name: donor.name,
            age: donor.age,
            gender: donor.gender,
            bloodGroup: donor.bloodGroup,
            phone: donor.phone,
            email: donor.email,
            address: donor.address,
            totalDonations: donor.totalDonations,
            lastDonationDate: donor.lastDonationDate,
            registeredBy: adminId,
            registeredByName: adminName,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
      donorsUpserted++;
    }

    console.log(`[SEED] Blood Bank verification complete: 8 blood groups checked, ${donorsUpserted} donor records verified.`);
  } catch (error) {
    console.error(`[SEED ERROR] Failed to seed Blood Bank: ${error.message}`);
  }
};

export default seedBloodBank;
