import http from 'http';

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

async function runTests() {
  console.log('===========================================================');
  console.log('  STAGE 3: DOCTOR / NURSE PROVIDER POPUP VERIFICATION SUITE');
  console.log('===========================================================\n');

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

  // 1. Unauthenticated request rejection
  console.log('--- Step 1: Endpoint Security & Token Requirement ---');
  const unauthRes = await req(`${API}/appointments/providers`);
  assert(unauthRes.status === 401, 'Unauthenticated /api/appointments/providers is blocked with 401 Unauthorized');

  // 2. Patient Login
  console.log('\n--- Step 2: Patient Authentication ---');
  const loginRes = await req(`${API}/auth/login`, {
    method: 'POST',
    body: { email: 'patient@medisync.local', password: 'Patient@2026!' }
  });
  assert(loginRes.ok && loginRes.data.token, 'Patient logged in successfully');
  const patientToken = loginRes.data?.token;
  const patientUser = loginRes.data?.user;
  const headers = { Authorization: `Bearer ${patientToken}` };

  // 3. Provider Listing Verification
  console.log('\n--- Step 3: MongoDB Provider Listing Verification ---');
  const provRes = await req(`${API}/appointments/providers`, { headers });
  assert(provRes.ok && provRes.data.success === true, 'GET /api/appointments/providers returned 200 OK');

  const doctors = provRes.data.doctors || [];
  const nurses = provRes.data.nurses || [];
  const providers = provRes.data.providers || [];

  assert(Array.isArray(doctors) && doctors.length > 0, `Returned ${doctors.length} active doctors from MongoDB`);
  assert(Array.isArray(nurses) && nurses.length > 0, `Returned ${nurses.length} active nurses from MongoDB`);
  assert(providers.length === doctors.length + nurses.length, `Combined providers length matches doctors + nurses (${providers.length} total)`);

  // Check Doctor Fields and Isolation
  let allDocsValid = true;
  let noNurseInDocs = true;
  let noPasswordsExposed = true;
  const docIds = new Set();
  let duplicateDocIds = 0;

  for (const doc of doctors) {
    if (!doc._id || !doc.name || doc.role !== 'doctor' || doc.isActive !== true) allDocsValid = false;
    if (doc.role === 'nurse') noNurseInDocs = false;
    if (doc.password || doc.passwordHash) noPasswordsExposed = false;
    if (docIds.has(doc._id)) duplicateDocIds++;
    docIds.add(doc._id);
  }

  assert(allDocsValid, 'All doctors have valid _id, name, role === "doctor", and isActive === true');
  assert(noNurseInDocs, 'Doctor list contains ZERO nurses (strict role isolation)');
  assert(duplicateDocIds === 0, 'Every doctor has a unique MongoDB _id (no duplicate accounts)');
  assert(noPasswordsExposed, 'Zero sensitive password fields exposed in provider payloads');

  // Check Nurse Fields and Isolation
  let allNursesValid = true;
  let noDocInNurses = true;
  const nurseIds = new Set();
  let duplicateNurseIds = 0;

  for (const nurse of nurses) {
    if (!nurse._id || !nurse.name || nurse.role !== 'nurse' || nurse.isActive !== true) allNursesValid = false;
    if (nurse.role === 'doctor') noDocInNurses = false;
    if (nurse.password || nurse.passwordHash) noPasswordsExposed = false;
    if (nurseIds.has(nurse._id)) duplicateNurseIds++;
    nurseIds.add(nurse._id);
  }

  assert(allNursesValid, 'All nurses have valid _id, name, role === "nurse", and isActive === true');
  assert(noDocInNurses, 'Nurse list contains ZERO doctors (strict role isolation)');
  assert(duplicateNurseIds === 0, 'Every nurse has a unique MongoDB _id (no duplicate accounts)');

  // 4. Booking specific doctor using MongoDB _id
  console.log('\n--- Step 4: Book Specific Doctor Using MongoDB _id ---');
  const targetDoctor = doctors[0];
  const uniqueDateDoc = `2026-12-${Math.floor(Math.random() * 20) + 10}`;
  const docSlot = '10:30 AM';

  const bookDocRes = await req(`${API}/appointments/book`, {
    method: 'POST',
    headers,
    body: {
      type: 'doctor',
      providerId: targetDoctor._id,
      date: uniqueDateDoc,
      time: docSlot,
      reason: 'Routine cardiology consultation'
    }
  });

  assert(bookDocRes.status === 201 && bookDocRes.data.success === true, 'Successfully booked appointment with specific doctor');
  const createdDocAppt = bookDocRes.data?.appointment;
  assert(createdDocAppt?.status === 'Pending', 'Appointment initial status is "Pending"');
  assert(createdDocAppt?.providerId === targetDoctor._id, `Appointment providerId (${createdDocAppt?.providerId}) strictly equals target doctor MongoDB _id (${targetDoctor._id})`);
  assert(createdDocAppt?.providerName === targetDoctor.name, `Appointment providerName (${createdDocAppt?.providerName}) matches MongoDB doctor record (${targetDoctor.name})`);

  // 5. Booking specific nurse using MongoDB _id
  console.log('\n--- Step 5: Book Specific Nurse Using MongoDB _id ---');
  const targetNurse = nurses[0];
  const uniqueDateNurse = `2026-12-${Math.floor(Math.random() * 20) + 10}`;
  const nurseSlot = '02:30 PM';

  const bookNurseRes = await req(`${API}/appointments/book`, {
    method: 'POST',
    headers,
    body: {
      type: 'nurse',
      providerId: targetNurse._id,
      service: 'Blood Sugar Test (Glucose)',
      date: uniqueDateNurse,
      time: nurseSlot,
      reason: 'Fasting blood sugar test'
    }
  });

  assert(bookNurseRes.status === 201 && bookNurseRes.data.success === true, 'Successfully booked appointment with specific nurse');
  const createdNurseAppt = bookNurseRes.data?.appointment;
  assert(createdNurseAppt?.type === 'nurse', 'Appointment type is "nurse"');
  assert(createdNurseAppt?.status === 'Pending', 'Appointment initial status is "Pending"');
  assert(createdNurseAppt?.providerId === targetNurse._id, `Appointment providerId (${createdNurseAppt?.providerId}) strictly equals target nurse MongoDB _id (${targetNurse._id})`);
  assert(createdNurseAppt?.providerName === targetNurse.name, `Appointment providerName (${createdNurseAppt?.providerName}) matches MongoDB nurse record (${targetNurse.name})`);

  // 6. Mismatch & Invalid Provider Verification
  console.log('\n--- Step 6: Mismatch & Invalid Provider Security Checks ---');
  // Doctor ID passed with type: 'nurse'
  const mismatchRes = await req(`${API}/appointments/book`, {
    method: 'POST',
    headers,
    body: {
      type: 'nurse',
      providerId: targetDoctor._id,
      date: uniqueDateDoc,
      time: '04:00 PM',
      reason: 'Should fail due to role mismatch'
    }
  });
  assert(mismatchRes.status === 400, `Type mismatch rejected with HTTP 400 (got ${mismatchRes.status})`);

  // Non-existent providerId
  const fakeIdRes = await req(`${API}/appointments/book`, {
    method: 'POST',
    headers,
    body: {
      type: 'doctor',
      providerId: '60c72b2f9b1d8b0015f8c888',
      date: uniqueDateDoc,
      time: '04:00 PM',
      reason: 'Non-existent provider'
    }
  });
  assert(fakeIdRes.status === 404, `Non-existent providerId rejected with HTTP 404 (got ${fakeIdRes.status})`);

  console.log('\n===========================================================');
  console.log(`  VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
