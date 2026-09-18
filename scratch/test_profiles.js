const BASE_URL = 'http://localhost:5000/api';

const TEST_ACCOUNTS = [
  { role: 'admin', email: 'admin@medisync.local', password: 'Admin@2026!' },
  { role: 'doctor', email: 'doctor@medisync.local', password: 'DocArun@2026!' },
  { role: 'nurse', email: 'anitha@medisync.com', password: 'NurseAnitha@2026!' },
  { role: 'receptionist', email: 'receptionist@medisync.local', password: 'Recept@2026!' },
  { role: 'pharmacist', email: 'pharmacist@medisync.local', password: 'Pharm@2026!' },
  { role: 'patient', email: 'patient@medisync.local', password: 'Patient@2026!' },
];

async function runTests() {
  console.log('=== STARTING PROFILE MANAGEMENT TESTS ===');
  let allPassed = true;

  for (const acc of TEST_ACCOUNTS) {
    console.log(`\n--- Testing Persona: ${acc.role.toUpperCase()} (${acc.email}) ---`);
    
    // 1. Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.email, password: acc.password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.token) {
      console.error(`❌ Login failed for ${acc.email}:`, loginData);
      allPassed = false;
      continue;
    }
    const token = loginData.token;
    console.log(`✅ Logged in successfully. Token acquired.`);

    // 2. GET /api/profile/me
    const getRes = await fetch(`${BASE_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getData = await getRes.json();
    if (getRes.ok && getData.success && getData.user.email === acc.email) {
      console.log(`✅ GET /api/profile/me returned valid profile for ${getData.user.name} [Role: ${getData.user.role}]`);
      if (getData.user.password || getData.user.passwordHash) {
        console.error(`❌ Security failure: Password was returned in profile response!`);
        allPassed = false;
      }
    } else {
      console.error(`❌ GET /api/profile/me failed:`, getData);
      allPassed = false;
    }

    // 3. PUT /api/profile/me (Updating allowed fields)
    const updatePayload = {
      phone: '9876543210',
      address: '100 Medical Center Way',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      emergencyContact: {
        name: 'Emergency Guardian',
        phone: '9876543219',
      },
      bio: `Official certified ${acc.role} profile at MediSync AI Hospital.`,
    };

    if (acc.role === 'patient') {
      updatePayload.bloodGroup = 'B+';
      updatePayload.gender = 'Male';
    } else {
      updatePayload.professionalDetails = {
        department: acc.role === 'doctor' ? 'Cardiology' : acc.role === 'nurse' ? 'General Nursing' : 'Administration',
        specialization: acc.role === 'doctor' ? 'Interventional Cardiology' : '',
        licenseNumber: `LIC-${acc.role.toUpperCase()}-2026`,
        experienceYears: 8,
        qualifications: acc.role === 'doctor' ? 'MBBS, MD' : 'B.Sc Nursing',
        employeeId: `EMP-${acc.role.toUpperCase()}-01`,
      };
    }

    const putRes = await fetch(`${BASE_URL}/profile/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatePayload),
    });
    const putData = await putRes.json();
    if (putRes.ok && putData.success && putData.user.city === 'Metropolis') {
      console.log(`✅ PUT /api/profile/me successfully persisted profile fields for ${acc.role}`);
    } else {
      console.error(`❌ PUT /api/profile/me failed for ${acc.role}:`, putData);
      allPassed = false;
    }

    // 4. PUT /api/profile/me/picture (Testing Profile Picture upload)
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const picRes = await fetch(`${BASE_URL}/profile/me/picture`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profilePicture: sampleBase64 }),
    });
    const picData = await picRes.json();
    if (picRes.ok && picData.success && picData.user.profilePicture.startsWith('data:image/png;base64,')) {
      console.log(`✅ PUT /api/profile/me/picture persisted Base64 image for ${acc.role}`);
    } else {
      console.error(`❌ PUT /api/profile/me/picture failed for ${acc.role}:`, picData);
      allPassed = false;
    }

    // 5. Security & Whitelist Test: Attempting unauthorized modifications
    const maliciousPayload = {
      role: 'admin',
      isActive: false,
      vitals: { temp: '105', bp: '180/120', bloodSugar: '450' },
      prescriptions: [{ medicine: 'Illegal Drug', dosage: '5-5-5' }],
    };
    const secRes = await fetch(`${BASE_URL}/profile/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(maliciousPayload),
    });
    const secData = await secRes.json();
    if (secRes.ok && secData.user.role === acc.role && secData.user.isActive === true) {
      console.log(`✅ Security test PASSED: Role tamper attempt ignored, role remains "${secData.user.role}"`);
    } else {
      console.error(`❌ Security test FAILED for ${acc.role}:`, secData);
      allPassed = false;
    }

    // 6. Patient-specific Blood Group synchronization verification
    if (acc.role === 'patient') {
      const patientCheckRes = await fetch(`${BASE_URL}/patients/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const patientCheckData = await patientCheckRes.json();
      if (patientCheckRes.ok && patientCheckData.patient?.bloodGroup === 'B+') {
        console.log(`✅ Patient Blood Group synchronized to Patient model in MongoDB: ${patientCheckData.patient.bloodGroup}`);
      } else {
        console.error(`❌ Patient Blood Group synchronization mismatch:`, patientCheckData);
        allPassed = false;
      }
    }
  }

  console.log('\n=============================================');
  if (allPassed) {
    console.log('🎉 ALL PROFILE MANAGEMENT TESTS PASSED!');
  } else {
    console.log('❌ SOME TESTS FAILED. PLEASE REVIEW LOGS.');
  }
}

runTests().catch(console.error);
