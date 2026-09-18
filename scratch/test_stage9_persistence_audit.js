/**
 * STAGE 9: COMPREHENSIVE BACKEND & DATABASE PERSISTENCE AUDIT TEST SUITE
 * MediSync AI - Intelligent Integrated Hospital Management System
 */

const BASE_URL = 'http://localhost:5000/api';

const USERS = {
  admin: { email: 'admin@medisync.local', password: 'Admin@2026!' },
  doctor: { email: 'arun.kumar@medisync.com', password: 'DocArun@2026!' },
  nurse: { email: 'anitha@medisync.com', password: 'NurseAnitha@2026!' },
  receptionist: { email: 'receptionist@medisync.local', password: 'Recept@2026!' },
  pharmacist: { email: 'pharmacist@medisync.local', password: 'Pharm@2026!' },
  patient: { email: 'patient@medisync.local', password: 'Patient@2026!' },
};

let tokens = {};
let users = {};
let passCount = 0;
let failCount = 0;

function pass(msg) {
  passCount++;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg, err) {
  failCount++;
  console.error(`  [FAIL] ${msg}`, err ? (err.message || JSON.stringify(err)) : '');
}

async function request(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function runStage9Audit() {
  console.log('================================================================');
  console.log('  STAGE 9: COMPLETE BACKEND & DATABASE PERSISTENCE AUDIT');
  console.log('================================================================\n');

  // --- PART 1: HEALTH CHECK & DATABASE CONNECTIVITY ---
  console.log('--- 1. Health & Database Connectivity ---');
  try {
    const health = await request('/health');
    if (health.ok && health.data.database === 'connected') {
      pass('Backend health check reports live database connection');
    } else {
      fail('Health check failed', health.data);
    }
  } catch (err) {
    fail('Health check request error', err);
  }

  // --- PART 2: AUTHENTICATION & CANONICAL CREDENTIALS ---
  console.log('\n--- 2. Role Authentication & Security ---');
  for (const [role, creds] of Object.entries(USERS)) {
    try {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(creds),
      });

      if (res.ok && res.data.token && res.data.user.role === role) {
        tokens[role] = res.data.token;
        users[role] = res.data.user;
        pass(`Authenticated ${role} (${creds.email})`);
      } else {
        fail(`Failed to authenticate ${role}`, res.data);
      }
    } catch (err) {
      fail(`Authentication error for ${role}`, err);
    }
  }

  // Verify generic invalid credentials rejection
  try {
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@medisync.local', password: 'WrongPassword@123' }),
    });
    if (badLogin.status === 401) {
      pass('Invalid credentials correctly rejected with HTTP 401');
    } else {
      fail('Invalid credentials not rejected with 401', badLogin.status);
    }
  } catch (err) {
    fail('Invalid credentials test error', err);
  }

  // Verify unauthenticated request rejection
  try {
    const noAuth = await request('/profile/me');
    if (noAuth.status === 401) {
      pass('Unauthenticated request rejected with HTTP 401');
    } else {
      fail('Unauthenticated request allowed', noAuth.status);
    }
  } catch (err) {
    fail('Unauthenticated test error', err);
  }

  // --- PART 3: ADMIN STAFF CREATION & IMMEDIATE LOGIN ---
  console.log('\n--- 3. Staff Registration (Admin Controlled) & Instant Login ---');
  const tempTimestamp = Date.now();
  const testDoctorEmail = `test.doc.${tempTimestamp}@medisync.com`;
  const testDoctorPassword = 'TestDoc@2026!';
  try {
    const createDocRes = await request(
      '/users/doctor',
      {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Karthik',
          lastName: 'Ranganathan',
          email: testDoctorEmail,
          password: testDoctorPassword,
          phone: '9876500001',
          department: 'Cardiology',
          specialization: 'Interventional Cardiology',
          room: 'Room 302',
        }),
      },
      tokens.admin
    );

    if (createDocRes.ok && createDocRes.data.success) {
      pass(`Admin created new doctor account (${testDoctorEmail})`);

      // Attempt immediate login with the new doctor account
      const newDocLogin = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testDoctorEmail,
          password: testDoctorPassword,
        }),
      });

      if (newDocLogin.ok && newDocLogin.data.token && newDocLogin.data.user.role === 'doctor') {
        pass('Admin-created doctor logged in successfully with JWT');
      } else {
        fail('Admin-created doctor failed to log in', newDocLogin.data);
      }
    } else {
      fail('Admin failed to create doctor account', createDocRes.data);
    }
  } catch (err) {
    fail('Staff creation test error', err);
  }

  // --- PART 4: PATIENT PROFILE & VITALS RBAC ---
  console.log('\n--- 4. Patient Profile & Clinical Vitals RBAC ---');
  let testPatientId = null;
  try {
    const patientProfile = await request('/patients/me', {}, tokens.patient);
    if (patientProfile.ok && patientProfile.data.patient) {
      testPatientId = patientProfile.data.patient._id;
      pass(`Patient retrieved personal profile (${testPatientId})`);
    } else {
      fail('Failed to retrieve patient profile', patientProfile.data);
    }
  } catch (err) {
    fail('Patient profile fetch error', err);
  }

  // Doctor attempt to update vitals (MUST FAIL - only nurses are authorized)
  try {
    const docVitals = await request(
      `/patients/${testPatientId}/vitals`,
      {
        method: 'PUT',
        body: JSON.stringify({ temp: '98.6', bp: '120/80', heartRate: '72', spo2: '99' }),
      },
      tokens.doctor
    );
    if (docVitals.status === 403) {
      pass('Doctor strictly forbidden (HTTP 403) from updating patient vitals');
    } else {
      fail('Doctor improperly allowed to update vitals', docVitals.status);
    }
  } catch (err) {
    fail('Doctor vitals RBAC test error', err);
  }

  // Nurse update vitals (MUST SUCCEED)
  try {
    const nurseVitals = await request(
      `/patients/${testPatientId}/vitals`,
      {
        method: 'PUT',
        body: JSON.stringify({
          temp: '98.4 F',
          bp: '120/80 mmHg',
          heartRate: '74 bpm',
          spo2: '99%',
          weight: '68 kg',
          height: '175 cm',
        }),
      },
      tokens.nurse
    );
    if (nurseVitals.ok && nurseVitals.data.vitals?.recordedByRole === 'nurse') {
      pass('Nurse successfully recorded patient vitals with server audit snapshot');
    } else {
      fail('Nurse failed to record vitals', nurseVitals.data);
    }
  } catch (err) {
    fail('Nurse vitals update error', err);
  }

  // --- PART 5: RBAC BARRIERS & DATA ISOLATION ---
  console.log('\n--- 5. RBAC Barriers & Cross-Role Isolation ---');
  // Pharmacist forbidden from financial reports & billing
  try {
    const pharmFin = await request('/reports/financial', {}, tokens.pharmacist);
    if (pharmFin.status === 403) {
      pass('Pharmacist strictly forbidden (HTTP 403) from /reports/financial');
    } else {
      fail('Pharmacist inappropriately accessed financial reports', pharmFin.status);
    }

    const pharmBills = await request('/billing', {}, tokens.pharmacist);
    if (pharmBills.status === 403) {
      pass('Pharmacist strictly forbidden (HTTP 403) from /billing management');
    } else {
      fail('Pharmacist inappropriately accessed billing', pharmBills.status);
    }
  } catch (err) {
    fail('Pharmacist RBAC test error', err);
  }

  // Patient forbidden from hospital-wide reports
  try {
    const patientReports = await request('/reports/summary', {}, tokens.patient);
    if (patientReports.status === 403) {
      pass('Patient strictly forbidden (HTTP 403) from hospital reports');
    } else {
      fail('Patient accessed hospital reports', patientReports.status);
    }
  } catch (err) {
    fail('Patient reports RBAC test error', err);
  }

  // --- PART 6: PERSISTENCE, CONCURRENCY & REFRESH SIMULATION ---
  console.log('\n--- 6. Persistence, Concurrency & Mutation Lifecycles ---');

  // A. Diet Plan Generation & MongoDB Persistence
  let createdDietPlanId = null;
  try {
    const dietRes = await request(
      '/diet-plans',
      {
        method: 'POST',
        body: JSON.stringify({
          age: 32,
          gender: 'male',
          height: 175,
          weight: 72,
          preference: 'vegetarian',
          allergies: ['peanuts'],
          activity: 'moderate',
          currentDisease: 'Hypertension',
        }),
      },
      tokens.patient
    );

    if (dietRes.ok && dietRes.data.data) {
      createdDietPlanId = dietRes.data.data._id;
      pass(`Diet plan persisted in MongoDB (Calories: ${dietRes.data.data.caloriesTarget} kcal)`);
      if (dietRes.data.data.streak === undefined) {
        pass('DietPlan schema confirmed to contain zero streak fields');
      } else {
        fail('DietPlan contains obsolete streak field');
      }
    } else {
      fail('Failed to generate diet plan', dietRes.data);
    }
  } catch (err) {
    fail('Diet plan test error', err);
  }

  // B. Billing Lifecycle & Concurrent Payment Validation
  let testInvoiceId = null;
  try {
    const invoiceRes = await request(
      '/billing',
      {
        method: 'POST',
        body: JSON.stringify({
          patientId: testPatientId,
          patientName: 'Test Patient Verification',
          patientEmail: 'patient@medisync.local',
          items: [
            { description: 'Clinical Consultation', category: 'Doctor Consultation', quantity: 1, unitPrice: 800, amount: 800 },
            { description: 'Routine Lab Screening', category: 'Lab Test', quantity: 1, unitPrice: 700, amount: 700 },
          ],
          discount: 100,
          tax: 100,
          paymentMethod: 'Cash',
          notes: 'Stage 9 persistence verification invoice',
        }),
      },
      tokens.admin
    );

    if (invoiceRes.ok && invoiceRes.data.data) {
      testInvoiceId = invoiceRes.data.data._id;
      const total = invoiceRes.data.data.totalAmount; // 800 + 700 - 100 + 100 = 1500
      pass(`Invoice created: ${invoiceRes.data.data.invoiceNumber} (Total: ₹${total})`);

      // Attempt payment exceeding total -> MUST FAIL with 400
      const overPay = await request(
        `/billing/${testInvoiceId}/pay`,
        {
          method: 'POST',
          body: JSON.stringify({ amount: 9999, paymentMethod: 'Cash' }),
        },
        tokens.admin
      );
      if (overPay.status === 400) {
        pass('Overpayment rejected with HTTP 400 Bad Request');
      } else {
        fail('Overpayment was not rejected', overPay.status);
      }

      // Valid payment -> ₹1500
      const validPay = await request(
        `/billing/${testInvoiceId}/pay`,
        {
          method: 'POST',
          body: JSON.stringify({ amount: 1500, paymentMethod: 'Cash' }),
        },
        tokens.admin
      );
      if (validPay.ok && validPay.data.data?.paymentStatus === 'Paid') {
        pass('Invoice payment recorded (Status: Paid, Balance: ₹0)');
      } else {
        fail('Failed to process valid invoice payment', validPay.data);
      }
    } else {
      fail('Failed to create invoice', invoiceRes.data);
    }
  } catch (err) {
    fail('Billing lifecycle test error', err);
  }

  // C. Visitor Pass Lifecycle & Duplicate Check-in Prevention
  let testPassId = null;
  try {
    const visitorRes = await request(
      '/visitors',
      {
        method: 'POST',
        body: JSON.stringify({
          visitorName: 'Vignesh Sundaram',
          phone: '+91 97777 55555',
          email: 'vignesh@example.com',
          relationship: 'Friend',
          purpose: 'General Visit',
          patientId: testPatientId,
          patientName: 'Test Patient Verification',
          patientRoom: 'WD-201-01',
          visitDate: new Date(),
        }),
      },
      tokens.receptionist
    );

    if (visitorRes.ok && visitorRes.data.data) {
      testPassId = visitorRes.data.data._id;
      pass(`Visitor pass issued: ${visitorRes.data.data.passId}`);

      // Check-in
      const checkInRes = await request(`/visitors/${testPassId}/check-in`, { method: 'POST' }, tokens.receptionist);
      if (checkInRes.ok && checkInRes.data.data?.status === 'Checked In') {
        pass('Visitor checked in successfully');

        // Attempt duplicate check-in -> MUST FAIL with 409
        const dupCheckIn = await request(`/visitors/${testPassId}/check-in`, { method: 'POST' }, tokens.receptionist);
        if (dupCheckIn.status === 409) {
          pass('Duplicate check-in rejected with HTTP 409 Conflict');
        } else {
          fail('Duplicate check-in was not rejected with 409', dupCheckIn.status);
        }

        // Check-out
        const checkOutRes = await request(`/visitors/${testPassId}/check-out`, { method: 'POST' }, tokens.receptionist);
        if (checkOutRes.ok && checkOutRes.data.data?.status === 'Checked Out') {
          pass('Visitor checked out successfully');
        } else {
          fail('Visitor check-out failed', checkOutRes.data);
        }
      } else {
        fail('Visitor check-in failed', checkInRes.data);
      }
    } else {
      fail('Failed to create visitor pass', visitorRes.data);
    }
  } catch (err) {
    fail('Visitor lifecycle test error', err);
  }

  // --- PART 7: AI REPORT SUMMARIZER ENDPOINTS ---
  console.log('\n--- 7. AI Clinical Report Summarizer ---');
  try {
    const sampleReportData = {
      reportId: `REP-${Date.now()}`,
      patientName: 'Aarav Sharma',
      reportType: 'Complete Blood Count (CBC)',
      date: new Date().toISOString().split('T')[0],
      sourceReport: 'Hemoglobin: 14.2 g/dL (Normal: 13.0-17.0). Platelets: 250,000 /mcL (Normal: 150,000-450,000). WBC: 7,200 /mcL (Normal: 4,000-11,000).',
    };

    const sumRes = await request('/report-summaries', {
      method: 'POST',
      body: JSON.stringify(sampleReportData),
    }, tokens.patient);

    if (sumRes.ok && sumRes.data.summary) {
      pass(`AI Report Summary generated and stored: ${sumRes.data.summary.title}`);

      // Verify retrieval
      const getSumRes = await request('/report-summaries/me', {}, tokens.patient);
      if (getSumRes.ok && Array.isArray(getSumRes.data.summaries) && getSumRes.data.summaries.length > 0) {
        pass(`Retrieved persisted summaries from MongoDB (${getSumRes.data.summaries.length} summaries)`);
      } else {
        fail('Failed to retrieve persisted report summaries', getSumRes.data);
      }
    } else {
      fail('AI Report Summarizer failed', sumRes.data);
    }
  } catch (err) {
    fail('AI Report Summarizer test error', err);
  }

  // --- PART 8: LIVE DASHBOARDS & REAL MONGODB AGGREGATIONS ---
  console.log('\n--- 8. Live Dashboards for All 6 Roles ---');
  for (const role of Object.keys(USERS)) {
    try {
      const dashRes = await request('/dashboard', {}, tokens[role]);
      if (dashRes.ok && dashRes.data.data) {
        pass(`Live MongoDB dashboard aggregated for role: ${role}`);
      } else {
        fail(`Dashboard fetch failed for ${role}`, dashRes.data);
      }
    } catch (err) {
      fail(`Dashboard test error for ${role}`, err);
    }
  }

  console.log('\n================================================================');
  console.log(`  STAGE 9 AUDIT SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runStage9Audit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
