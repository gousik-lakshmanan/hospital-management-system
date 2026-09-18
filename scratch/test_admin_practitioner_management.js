const API = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED PRACTITIONER & STAGE 2 VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Admin Login
  console.log('--- Step 1: Administrator Authentication ---');
  let adminToken = '';
  try {
    const adminRes = await req(`${API}/auth/login`, {
      method: 'POST',
      body: {
        email: 'admin@medisync.local',
        password: 'Admin@2026!'
      }
    });
    assert(adminRes.ok && adminRes.data.success === true, 'Admin login succeeded');
    assert(adminRes.data.user?.role === 'admin', 'Admin role verified');
    adminToken = adminRes.data.token;
  } catch (err) {
    assert(false, `Admin login failed: ${err.message}`);
    return;
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 2. Admin creates a Doctor
  console.log('\n--- Step 2: Admin Creates Doctor Account ---');
  const uniqueDocEmail = `doc.stage2.${Date.now()}@medisync.com`;
  const docPassword = 'DocTest@2026!';
  let createdDocId = null;

  try {
    const createDocRes = await req(`${API}/users/doctors`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        firstName: 'Siddharth',
        lastName: 'Roy',
        email: uniqueDocEmail,
        phone: '9887766554',
        password: docPassword,
        department: 'Cardiology',
        specialization: 'Interventional Cardiology',
        room: 'Consultation Room 302'
      }
    });

    assert(createDocRes.ok && createDocRes.data.success === true, 'Admin successfully created doctor');
    assert(createDocRes.data.user?.role === 'doctor', 'Created user has role doctor');
    assert(createDocRes.data.user?.email === uniqueDocEmail, 'Doctor email matches payload');
    assert(createDocRes.data.user?.password === undefined, 'Doctor password is not exposed in response');
    assert(createDocRes.data.user?.professionalDetails?.specialization === 'Interventional Cardiology', 'Professional specialization saved in MongoDB');
    createdDocId = createDocRes.data.user?.id || createDocRes.data.user?._id;
  } catch (err) {
    assert(false, `Doctor creation failed: ${err.message}`);
  }

  // 3. Newly created Doctor logs in via standard /api/auth/login
  console.log('\n--- Step 3: Newly Created Doctor Immediate Login ---');
  let docToken = '';
  try {
    const docLoginRes = await req(`${API}/auth/login`, {
      method: 'POST',
      body: {
        email: uniqueDocEmail,
        password: docPassword
      }
    });

    assert(docLoginRes.ok && docLoginRes.data.success === true, 'Newly created doctor logged in successfully via /api/auth/login');
    assert(docLoginRes.data.user?.role === 'doctor', 'Doctor role returned upon login');
    assert(docLoginRes.data.token != null, 'JWT token returned for newly created doctor');
    docToken = docLoginRes.data.token;
  } catch (err) {
    assert(false, `Doctor login failed: ${err.message}`);
  }

  // 4. Admin creates a Nurse
  console.log('\n--- Step 4: Admin Creates Nurse Account ---');
  const uniqueNurseEmail = `nurse.stage2.${Date.now()}@medisync.com`;
  const nursePassword = 'NurseTest@2026!';
  let createdNurseId = null;

  try {
    const createNurseRes = await req(`${API}/users/nurses`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        firstName: 'Divya',
        lastName: 'Menon',
        email: uniqueNurseEmail,
        phone: '9887766555',
        password: nursePassword,
        department: 'ICU',
        shift: 'Night'
      }
    });

    assert(createNurseRes.ok && createNurseRes.data.success === true, 'Admin successfully created nurse');
    assert(createNurseRes.data.user?.role === 'nurse', 'Created user has role nurse');
    assert(createNurseRes.data.user?.email === uniqueNurseEmail, 'Nurse email matches payload');
    assert(createNurseRes.data.user?.password === undefined, 'Nurse password is not exposed in response');
    assert(createNurseRes.data.user?.professionalDetails?.specialization?.includes('Night'), 'Professional shift saved in MongoDB');
    createdNurseId = createNurseRes.data.user?.id || createNurseRes.data.user?._id;
  } catch (err) {
    assert(false, `Nurse creation failed: ${err.message}`);
  }

  // 5. Newly created Nurse logs in via standard /api/auth/login
  console.log('\n--- Step 5: Newly Created Nurse Immediate Login ---');
  let nurseToken = '';
  try {
    const nurseLoginRes = await req(`${API}/auth/login`, {
      method: 'POST',
      body: {
        email: uniqueNurseEmail,
        password: nursePassword
      }
    });

    assert(nurseLoginRes.ok && nurseLoginRes.data.success === true, 'Newly created nurse logged in successfully via /api/auth/login');
    assert(nurseLoginRes.data.user?.role === 'nurse', 'Nurse role returned upon login');
    assert(nurseLoginRes.data.token != null, 'JWT token returned for newly created nurse');
    nurseToken = nurseLoginRes.data.token;
  } catch (err) {
    assert(false, `Nurse login failed: ${err.message}`);
  }

  // 6. Security and Edge Case Tests
  console.log('\n--- Step 6: Security Barriers & Validation ---');

  // 6a. Non-Admin (Doctor) tries to create a doctor -> 403
  try {
    const res = await req(`${API}/users/doctors`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${docToken}` },
      body: {
        firstName: 'Hacker',
        lastName: 'Doc',
        email: `hackdoc.${Date.now()}@medisync.com`,
        password: 'Password@123'
      }
    });
    assert(res.status === 403, 'Doctor forbidden from creating doctor (HTTP 403)');
  } catch (err) {
    assert(false, `Doctor creation check threw error: ${err.message}`);
  }

  // 6b. Non-Admin (Nurse) tries to create a nurse -> 403
  try {
    const res = await req(`${API}/users/nurses`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${nurseToken}` },
      body: {
        firstName: 'Hacker',
        lastName: 'Nurse',
        email: `hacknurse.${Date.now()}@medisync.com`,
        password: 'Password@123'
      }
    });
    assert(res.status === 403, 'Nurse forbidden from creating nurse (HTTP 403)');
  } catch (err) {
    assert(false, `Nurse creation check threw error: ${err.message}`);
  }

  // 6c. Unauthenticated attempt -> 401
  try {
    const res = await req(`${API}/users/doctors`, {
      method: 'POST',
      body: {
        firstName: 'Anon',
        lastName: 'Doc',
        email: `anondoc.${Date.now()}@medisync.com`,
        password: 'Password@123'
      }
    });
    assert(res.status === 401, 'Unauthenticated request rejected with HTTP 401');
  } catch (err) {
    assert(false, `Unauthenticated check threw error: ${err.message}`);
  }

  // 6d. Duplicate Email -> 409
  try {
    const res = await req(`${API}/users/doctors`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        firstName: 'Duplicate',
        lastName: 'Doc',
        email: uniqueDocEmail,
        password: 'Password@123'
      }
    });
    assert(res.status === 409, 'Duplicate doctor email rejected with HTTP 409');
  } catch (err) {
    assert(false, `Duplicate email check threw error: ${err.message}`);
  }

  // 6e. Public Registration Role Escalation Attempt    // 6.5 Public registration rejecting non-patient role
  try {
    const pubRegRes = await req(`${API}/auth/register`, {
      method: 'POST',
      body: {
        firstName: 'Public',
        lastName: 'Intruder',
        email: `intruder.${Date.now()}@test.com`,
        password: 'Password@123',
        role: 'doctor'
      }
    });
    assert(pubRegRes.status === 403, 'Public registration with role doctor rejected with HTTP 403 Forbidden');
  } catch (err) {
    assert(false, `Public registration test failed: ${err.message}`);
  }

  // 7. Directory Retrieval
  console.log('\n--- Step 7: Directory Listings ---');
  try {
    const doctorsListRes = await req(`${API}/users/doctors`, {
      headers: adminHeaders
    });
    assert(doctorsListRes.ok && doctorsListRes.data.success === true, 'GET /api/users/doctors succeeded');
    assert(Array.isArray(doctorsListRes.data.doctors), 'Returned doctors list is an array');
    const hasCreatedDoc = doctorsListRes.data.doctors.some((d) => d.email === uniqueDocEmail);
    assert(hasCreatedDoc, 'Newly created doctor appears in GET /api/users/doctors');

    const nursesListRes = await req(`${API}/users/nurses`, {
      headers: adminHeaders
    });
    assert(nursesListRes.ok && nursesListRes.data.success === true, 'GET /api/users/nurses succeeded');
    assert(Array.isArray(nursesListRes.data.nurses), 'Returned nurses list is an array');
    const hasCreatedNurse = nursesListRes.data.nurses.some((n) => n.email === uniqueNurseEmail);
    assert(hasCreatedNurse, 'Newly created nurse appears in GET /api/users/nurses');
  } catch (err) {
    assert(false, `Directory retrieval failed: ${err.message}`);
  }

  // 8. Profile & Stage 2 Flow Verification
  console.log('\n--- Step 8: Profile & Stage 2 Flow for Created Practitioners ---');
  try {
    // Check doctor profile
    const docProfileRes = await req(`${API}/profile/me`, {
      headers: { Authorization: `Bearer ${docToken}` }
    });
    assert(docProfileRes.ok && docProfileRes.data.success === true, 'Doctor profile fetched successfully');
    assert(docProfileRes.data.user?.role === 'doctor', 'Doctor profile role is doctor');

    // Update doctor profile bio & phone
    const updateProfileRes = await req(`${API}/profile/me`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${docToken}` },
      body: {
        bio: 'Senior Cardiologist specializing in bypass and angioplasty',
        phone: '9998887776'
      }
    });
    assert(updateProfileRes.ok && updateProfileRes.data.success === true, 'Doctor profile update succeeded');
    assert(updateProfileRes.data.user?.bio === 'Senior Cardiologist specializing in bypass and angioplasty', 'Doctor bio updated in MongoDB');

    // Check nurse profile
    const nurseProfileRes = await req(`${API}/profile/me`, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(nurseProfileRes.ok && nurseProfileRes.data.success === true, 'Nurse profile fetched successfully');
    assert(nurseProfileRes.data.user?.role === 'nurse', 'Nurse profile role is nurse');
  } catch (err) {
    assert(false, `Profile check failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

run();
