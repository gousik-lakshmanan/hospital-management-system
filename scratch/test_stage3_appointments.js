import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('  STAGE 3 APPOINTMENTS AUTOMATED VERIFICATION SUITE ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // 1. Authenticate users
  console.log('--- Step 1: User Authentication ---');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@medisync.local', password: 'Admin@2026!' }
  });
  assert(adminLogin.ok && adminLogin.data.token, 'Admin login');
  const adminToken = adminLogin.data?.token;

  const doctorLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'arun.kumar@medisync.com', password: 'DocArun@2026!' }
  });
  assert(doctorLogin.ok && doctorLogin.data.token, 'Doctor login');
  const doctorToken = doctorLogin.data?.token;
  const doctorUser = doctorLogin.data?.user;

  const nurseLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'anitha@medisync.com', password: 'NurseAnitha@2026!' }
  });
  assert(nurseLogin.ok && nurseLogin.data.token, 'Nurse login');
  const nurseToken = nurseLogin.data?.token;
  const nurseUser = nurseLogin.data?.user;

  const patientLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'patient@medisync.local', password: 'Patient@2026!' }
  });
  assert(patientLogin.ok && patientLogin.data.token, 'Patient login');
  const patientToken = patientLogin.data?.token;
  const patientUser = patientLogin.data?.user;

  // 2. Provider Discovery
  console.log('\n--- Step 2: Provider Discovery ---');
  const providersRes = await request('/appointments/providers', { token: patientToken });
  assert(providersRes.ok && providersRes.data.success, 'Fetch active providers');
  const doctors = providersRes.data?.doctors || [];
  const nurses = providersRes.data?.nurses || [];
  assert(doctors.length > 0, `Discovered ${doctors.length} doctors`);
  assert(nurses.length > 0, `Discovered ${nurses.length} nurses`);
  
  const testDoctor = doctors.find(d => d._id === doctorUser.id || d._id === doctorUser._id) || doctors[0];
  const testNurse = nurses.find(n => n._id === nurseUser.id || n._id === nurseUser._id) || nurses[0];

  // Pick unique test dates/times using unique random day and hour to avoid test slot collisions
  const randYear = 2027 + Math.floor(Math.random() * 5);
  const randMonth = String(Math.floor(Math.random() * 11) + 1).padStart(2, '0');
  const randDay = String(Math.floor(Math.random() * 25) + 1).padStart(2, '0');
  const randMin = String(Math.floor(Math.random() * 50) + 10);
  const uniqueDate1 = `${randYear}-${randMonth}-${randDay}`;
  const uniqueDate2 = `${randYear}-${randMonth}-${String(Number(randDay) + 1).padStart(2, '0')}`;
  const uniqueSlot1 = `09:${randMin} AM`;
  const uniqueSlot2 = `11:${randMin} AM`;
  const uniqueSlot3 = `02:${randMin} PM`;

  // 3. Patient books Doctor Appointment (Pending verification)
  console.log('\n--- Step 3: Patient -> Doctor Booking (Pending Lifecycle) ---');
  const bookDocRes = await request('/appointments/book', {
    method: 'POST',
    token: patientToken,
    body: {
      providerId: testDoctor._id,
      date: uniqueDate1,
      time: uniqueSlot1,
      reason: 'Chest pain consultation and ECG check'
    }
  });
  if (!bookDocRes.ok) {
    console.log('bookDocRes debug:', bookDocRes.status, JSON.stringify(bookDocRes.data));
  }
  assert(bookDocRes.status === 201 && bookDocRes.data.success, 'Book doctor appointment returns 201 Created');
  const docAppt = bookDocRes.data?.appointment;
  assert(docAppt?.status === 'Pending', `Appointment status is 'Pending' (got ${docAppt?.status})`);
  assert(docAppt?.providerId === testDoctor._id || docAppt?.providerId?._id === testDoctor._id, 'Provider ID mapped correctly');
  assert(docAppt?.patientId === patientUser.id || docAppt?.patientId?._id === patientUser.id, 'Patient ID derived from JWT');

  // 4. Doctor views Pending Request
  console.log('\n--- Step 4: Doctor Queue & Pending Requests ---');
  const docListRes = await request('/appointments/doctor', { token: doctorToken });
  assert(docListRes.ok && docListRes.data.success, 'Doctor fetches appointments');
  const docAppointments = docListRes.data?.appointments || [];
  const foundPendingInDoc = docAppointments.find(a => (a._id === docAppt._id || a.id === docAppt._id) && a.status === 'Pending');
  assert(!!foundPendingInDoc, 'Doctor sees incoming pending request in queue');

  // 5. Doctor Accepts Request -> Confirmed
  console.log('\n--- Step 5: Doctor Accepts Request -> Confirmed ---');
  const acceptRes = await request(`/appointments/${docAppt._id}/status`, {
    method: 'PATCH',
    token: doctorToken,
    body: { status: 'Confirmed' }
  });
  assert(acceptRes.ok && acceptRes.data.success, 'Doctor accepts appointment');
  assert(acceptRes.data.appointment?.status === 'Confirmed', 'Status updated to Confirmed');
  assert(!!acceptRes.data.appointment?.respondedAt, 'RespondedAt timestamp recorded');

  // 6. Slot Conflict (HTTP 409) Test
  console.log('\n--- Step 6: Slot Conflict Prevention (HTTP 409) ---');
  const conflictRes = await request('/appointments/book', {
    method: 'POST',
    token: patientToken,
    body: {
      providerId: testDoctor._id,
      date: uniqueDate1,
      time: uniqueSlot1,
      reason: 'Another booking for same doctor at same time'
    }
  });
  assert(conflictRes.status === 409, `Slot conflict returns HTTP 409 (got ${conflictRes.status})`);

  // 7. Patient -> Nurse Booking & Nurse Rejection
  console.log('\n--- Step 7: Patient -> Nurse Booking & Rejection Workflow ---');
  const bookNurseRes = await request('/appointments/book', {
    method: 'POST',
    token: patientToken,
    body: {
      providerId: testNurse._id,
      date: uniqueDate1,
      time: uniqueSlot2,
      reason: 'Vitals check and blood sample collection'
    }
  });
  assert(bookNurseRes.status === 201, 'Book nurse appointment returns 201');
  const nurseAppt = bookNurseRes.data?.appointment;
  assert(nurseAppt?.type === 'nurse', 'Appointment type is nurse');
  assert(nurseAppt?.status === 'Pending', 'Nurse appointment is Pending');

  const nurseListRes = await request('/appointments/nurse', { token: nurseToken });
  assert(nurseListRes.ok && nurseListRes.data.success, 'Nurse fetches appointments');

  const rejectRes = await request(`/appointments/${nurseAppt._id}/status`, {
    method: 'PATCH',
    token: nurseToken,
    body: { status: 'Rejected', notes: 'Ward duty conflict' }
  });
  assert(rejectRes.ok && rejectRes.data.appointment?.status === 'Rejected', 'Nurse rejects appointment -> status is Rejected');

  // 8. Rescheduling Workflow
  console.log('\n--- Step 8: Rescheduling Workflow ---');
  const bookRescheduleRes = await request('/appointments/book', {
    method: 'POST',
    token: patientToken,
    body: {
      providerId: testDoctor._id,
      date: uniqueDate2,
      time: uniqueSlot1,
      reason: 'Cardio follow-up'
    }
  });
  assert(bookRescheduleRes.status === 201, 'Book appointment for rescheduling test');
  const reschedAppt = bookRescheduleRes.data?.appointment;

  const doRescheduleRes = await request(`/appointments/${reschedAppt._id}/reschedule`, {
    method: 'PATCH',
    token: doctorToken,
    body: {
      date: uniqueDate2,
      time: uniqueSlot3,
      notes: 'Moved to afternoon clinic'
    }
  });
  assert(doRescheduleRes.ok && doRescheduleRes.data.success, 'Doctor reschedules appointment');
  assert(doRescheduleRes.data.appointment?.status === 'Rescheduled', 'Status updated to Rescheduled');
  assert(doRescheduleRes.data.appointment?.time === uniqueSlot3, 'Time updated to afternoon slot');

  // 9. Patient Cancellation Workflow
  console.log('\n--- Step 9: Patient Cancellation Workflow ---');
  const cancelRes = await request(`/appointments/${reschedAppt._id}/cancel`, {
    method: 'PATCH',
    token: patientToken,
    body: { reason: 'Personal emergency' }
  });
  assert(cancelRes.ok && cancelRes.data.success, 'Patient cancels appointment');
  assert(cancelRes.data.appointment?.status === 'Cancelled', 'Status updated to Cancelled');

  // 10. Patient Views My Appointments
  console.log('\n--- Step 10: Patient My Appointments Verification ---');
  const myApptsRes = await request('/appointments/my-appointments', { token: patientToken });
  assert(myApptsRes.ok && myApptsRes.data.success, 'Patient fetches my-appointments');
  const myAppts = myApptsRes.data?.appointments || [];
  assert(myAppts.length >= 3, `Patient sees all personal appointments (${myAppts.length} total)`);

  // 11. Security & RBAC Isolation Tests
  console.log('\n--- Step 11: Security & RBAC Isolation ---');
  // Patient cannot accept doctor appointment
  const unauthorizedAccept = await request(`/appointments/${docAppt._id}/status`, {
    method: 'PATCH',
    token: patientToken,
    body: { status: 'Confirmed' }
  });
  assert(unauthorizedAccept.status === 403, `Patient cannot modify appointment status (got ${unauthorizedAccept.status})`);

  // Patient cannot access doctor-only route
  const unauthorizedDocQueue = await request('/appointments/doctor', { token: patientToken });
  assert(unauthorizedDocQueue.status === 403, `Patient cannot access /appointments/doctor (got ${unauthorizedDocQueue.status})`);

  // Public registration restricted to Patient only
  const publicDoctorReg = await request('/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Hacker',
      lastName: 'Doc',
      email: 'hackerdoc@test.com',
      password: 'Password@123',
      role: 'doctor'
    }
  });
  assert(publicDoctorReg.status === 403, `Public doctor registration blocked (got ${publicDoctorReg.status})`);

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
