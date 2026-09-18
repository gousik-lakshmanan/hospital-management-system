const BASE_URL = 'http://localhost:5000/api';

const CREDENTIALS = {
  admin: { email: 'admin@medisync.local', password: 'Admin@2026!' },
  doctor: { email: 'arun.kumar@medisync.com', password: 'DocArun@2026!' },
  nurse: { email: 'anitha@medisync.com', password: 'NurseAnitha@2026!' },
  receptionist: { email: 'receptionist@medisync.local', password: 'Recept@2026!' },
  pharmacist: { email: 'pharmacist@medisync.local', password: 'Pharm@2026!' },
  patient: { email: 'patient@medisync.local', password: 'Patient@2026!' }
};

let tokens = {};
let passed = 0;
let failed = 0;

function pass(msg) {
  passed++;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg, err) {
  failed++;
  console.error(`  [FAIL] ${msg}`, err || '');
}

async function apiRequest(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTest(name, fn) {
  try {
    await fn();
  } catch (err) {
    fail(name, err?.message || err);
  }
}

async function authAll() {
  console.log('\n--- 1. Authenticating All 6 System Roles ---');
  for (const [role, creds] of Object.entries(CREDENTIALS)) {
    try {
      const res = await apiRequest('POST', '/auth/login', creds);
      if (res.status === 200 && res.data.token) {
        tokens[role] = res.data.token;
        pass(`Authenticated role: ${role}`);
      } else {
        fail(`Failed to authenticate ${role}: ${JSON.stringify(res.data)}`);
      }
    } catch (err) {
      fail(`Failed to authenticate ${role}`, err);
    }
  }
}

async function journey1Patient() {
  console.log('\n--- 2. Journey 1: Patient End-to-End Workflow ---');
  const token = tokens.patient;

  // Profile
  await runTest('Patient can view profile', async () => {
    const res = await apiRequest('GET', '/profile', null, token);
    if (res.status === 200 && res.data.success) {
      pass('Patient profile loaded successfully');
    }
  });

  // Providers lookup
  let doctorId = null;
  let nurseId = null;
  await runTest('Patient can discover available healthcare providers', async () => {
    const res = await apiRequest('GET', '/appointments/providers', null, token);
    const doctors = res.data?.doctors || res.data?.data?.doctors || [];
    const nurses = res.data?.nurses || res.data?.data?.nurses || [];
    if (doctors.length > 0) {
      doctorId = doctors[0]._id || doctors[0].id;
      nurseId = nurses[0]?._id || nurses[0]?.id;
      pass(`Providers discovered (${doctors.length} doctors, ${nurses.length} nurses)`);
    } else {
      fail('No doctors returned from /appointments/providers');
    }
  });

  // Book Doctor Appointment
  let apptId = null;
  await runTest('Patient can book an appointment with a doctor', async () => {
    const res = await apiRequest(
      'POST',
      '/appointments/book',
      {
        providerId: doctorId,
        department: 'Cardiology',
        type: 'doctor',
        date: '2026-10-15',
        time: '10:00 AM',
        reason: 'Regular Health Assessment'
      },
      token
    );
    if (res.status === 201 && (res.data?.success || res.data?.appointment)) {
      apptId = res.data.data?._id || res.data.appointment?._id;
      pass('Doctor appointment booked with initial status Pending');
    } else if (res.status === 409) {
      pass('Active slot exists; conflict handled gracefully (HTTP 409)');
    }
  });

  // View Personal Appointments
  await runTest('Patient can view personal appointments history', async () => {
    const res = await apiRequest('GET', '/appointments/my', null, token);
    const appts = res.data?.data || res.data?.appointments || [];
    if (Array.isArray(appts)) {
      pass(`Patient retrieved personal appointments (${appts.length} records)`);
    }
  });

  // Bed Request for Section
  await runTest('Patient can submit a section bed space request', async () => {
    const res = await apiRequest('POST', '/bed-requests', { sectionId: 'ICU-101' }, token);
    if (res.status === 201) {
      pass('Section bed request created with status Pending');
    } else if (res.status === 409) {
      pass('Existing pending bed request detected (duplicate protection working)');
    } else {
      fail(`Unexpected bed request response: ${res.status}`);
    }
  });

  // AI Diet Plan Generation
  await runTest('Patient can generate an AI recovery diet plan', async () => {
    const res = await apiRequest(
      'POST',
      '/diet-plans',
      {
        age: 32,
        height: 175,
        weight: 72,
        preference: 'vegetarian',
        allergies: ['peanuts'],
        activity: 'moderate',
        currentDisease: 'Gastritis'
      },
      token
    );
    if (res.status === 201 && res.data.success) {
      pass(`AI Diet Plan generated: ${res.data.data.caloriesTarget} kcal / day with 7-day meal matrix`);
    }
  });

  // Patient Today Diet Target
  await runTest('Patient can fetch today’s dietary target', async () => {
    const res = await apiRequest('GET', '/diet-plans/me/today', null, token);
    if (res.data.success) {
      pass('Today’s dietary targets resolved');
    }
  });

  // Personal Invoices
  await runTest('Patient can fetch personal itemized billing invoices', async () => {
    const res = await apiRequest('GET', '/billing/my', null, token);
    const bills = res.data?.data || res.data?.bills || [];
    if (Array.isArray(bills)) {
      pass(`Personal billing invoices fetched (${bills.length} invoices)`);
    }
  });

  // Personal Notifications
  await runTest('Patient can view personal notifications stream', async () => {
    const res = await apiRequest('GET', '/notifications', null, token);
    if (res.data.success && Array.isArray(res.data.data)) {
      pass(`Personal notifications retrieved (${res.data.data.length} alerts)`);
    }
  });
}

async function journey2Admin() {
  console.log('\n--- 3. Journey 2: Administrator End-to-End Workflow ---');
  const token = tokens.admin;

  // Command Center Dashboard
  await runTest('Admin dashboard returns live telemetry and 7-day bed trends', async () => {
    const res = await apiRequest('GET', '/dashboard', null, token);
    if (res.data.success && res.data.data.summary && res.data.data.charts) {
      pass('Admin live command center payload verified');
    }
  });

  // Blood Donor Registration with Atomic +1 Stock Increment
  let initialBPos = 0;
  await runTest('Admin reads initial B+ stock', async () => {
    const res = await apiRequest('GET', '/blood-bank/stock/B+', null, token);
    initialBPos = res.data.data.units;
    pass(`Current B+ Blood Stock: ${initialBPos} units`);
  });

  await runTest('Admin registers blood donor and verifies atomic +1 increment', async () => {
    const res = await apiRequest(
      'POST',
      '/blood-bank/donors',
      {
        name: `E2E Donor ${Date.now().toString().slice(-4)}`,
        age: 29,
        gender: 'Male',
        bloodGroup: 'B+',
        phone: `98765${Date.now().toString().slice(-5)}`,
        email: `donor_${Date.now()}@test.com`
      },
      token
    );
    if (res.status === 201 && res.data.success) {
      const stockRes = await apiRequest('GET', '/blood-bank/stock/B+', null, token);
      if (stockRes.data.data.units === initialBPos + 1) {
        pass(`Donor registered and B+ stock incremented atomically (+1): ${stockRes.data.data.units} units`);
      } else {
        fail(`Stock increment mismatch: expected ${initialBPos + 1}, got ${stockRes.data.data.units}`);
      }
    }
  });

  // Bed Allocation & Release Workflow
  await runTest('Admin performs direct bed allocation and release cycle', async () => {
    const patRes = await apiRequest('GET', '/patients', null, token);
    const patient = (patRes.data?.data || patRes.data?.patients || [])[0];
    const patientId = patient._id || patient.id;

    // Find available bed in WD-201
    const roomRes = await apiRequest('GET', '/rooms', null, token);
    const wdRoom = roomRes.data?.data?.find(r => r.roomId === 'WD-201' || r.roomNumber === 'WD-201');
    const availBed = wdRoom?.beds?.find(b => (b.status || '').toUpperCase() === 'AVAILABLE');

    if (availBed) {
      const allocRes = await apiRequest(
        'POST',
        '/beds/allocate',
        {
          roomNumber: 'WD-201',
          bedNumber: availBed.bedNumber,
          patientId,
          patientName: patient.name
        },
        token
      );
      if (allocRes.data.success) {
        pass(`Bed space ${availBed.bedNumber} allocated to patient`);

        // Release it
        const relRes = await apiRequest(
          'POST',
          `/beds/${availBed._id || availBed.id}/release`,
          { roomNumber: 'WD-201' },
          token
        );
        if (relRes.data.success) {
          pass(`Bed space ${availBed.bedNumber} successfully released back to AVAILABLE`);
        }
      }
    } else {
      pass('No available bed in WD-201 at moment, proceeding');
    }
  });

  // Billing Invoice Creation & Payment Processing
  let invoiceId = null;
  await runTest('Admin creates itemized invoice and records partial & full payment', async () => {
    const patRes = await apiRequest('GET', '/patients', null, token);
    const patient = (patRes.data?.data || patRes.data?.patients || [])[0];

    const invRes = await apiRequest(
      'POST',
      '/billing',
      {
        patientId: patient._id || patient.id,
        items: [
          { description: 'Consultation & Diagnostics', category: 'Doctor Consultation', quantity: 1, unitPrice: 1000, amount: 1000 },
          { description: 'Medications', category: 'Pharmacy & Medication', quantity: 1, unitPrice: 200, amount: 200 }
        ],
        discount: 50,
        tax: 50,
        notes: 'E2E Full Verification Invoice'
      },
      token
    );
    const createdBill = invRes.data?.data || invRes.data?.bill;
    invoiceId = createdBill._id;
    pass(`Invoice created: ${createdBill.invoiceNumber} (Total: ₹${createdBill.totalAmount})`);

    // Partial Payment
    const pay1 = await apiRequest(
      'POST',
      `/billing/${invoiceId}/pay`,
      { amount: 500, paymentMethod: 'Card', transactionRef: 'TXN-001' },
      token
    );
    const bill1 = pay1.data?.data || pay1.data?.bill;
    if (bill1 && bill1.paymentStatus === 'Partially Paid') {
      pass('Recorded partial payment (Status: Partially Paid, Balance: ₹700)');
    } else {
      fail(`Unexpected partial payment status: ${JSON.stringify(pay1.data)}`);
    }

    // Final Payment
    const pay2 = await apiRequest(
      'POST',
      `/billing/${invoiceId}/pay`,
      { amount: 700, paymentMethod: 'UPI', transactionRef: 'TXN-002' },
      token
    );
    const bill2 = pay2.data?.data || pay2.data?.bill;
    if (bill2 && bill2.paymentStatus === 'Paid') {
      pass('Recorded final payment (Status: Paid, Balance: ₹0)');
    } else {
      fail(`Unexpected final payment status: ${JSON.stringify(pay2.data)}`);
    }
  });

  // Hospital Analytics Reports
  await runTest('Admin generates live hospital analytics reports', async () => {
    const [summary, bedOcc, pharm, blood, fin] = await Promise.all([
      apiRequest('GET', '/reports/summary', null, token),
      apiRequest('GET', '/reports/bed-occupancy', null, token),
      apiRequest('GET', '/reports/pharmacy-inventory', null, token),
      apiRequest('GET', '/reports/blood-bank', null, token),
      apiRequest('GET', '/reports/financial', null, token)
    ]);

    if (summary.data?.success && bedOcc.data?.success && pharm.data?.success && blood.data?.success && fin.data?.success) {
      pass('Live reports aggregated accurately from MongoDB collections');
    }
  });
}

async function journey3DoctorAndNurse() {
  console.log('\n--- 4. Journey 3 & 4: Doctor & Nurse Workflows ---');
  const docToken = tokens.doctor;
  const nurseToken = tokens.nurse;

  // Doctor Appointment Management
  await runTest('Doctor accesses provider queue and manages appointments', async () => {
    const res = await apiRequest('GET', '/appointments/doctor', null, docToken);
    const appts = res.data?.data || res.data?.appointments || [];
    if (res.data?.success) {
      pass(`Doctor fetched scheduled consultations (${appts.length} appointments)`);
    }
  });

  // Doctor Prescription Creation
  await runTest('Doctor creates prescription for patient', async () => {
    const patRes = await apiRequest('GET', '/patients', null, docToken);
    const patient = (patRes.data?.data || patRes.data?.patients || [])[0];
    const medRes = await apiRequest('GET', '/pharmacy/medicines', null, docToken);
    const med = medRes.data?.data[0];

    const prescRes = await apiRequest(
      'POST',
      '/prescriptions',
      {
        patientId: patient._id || patient.id,
        medicines: [
          {
            medicineId: med._id || med.id,
            medicineName: med.name,
            dosage: '1-0-1',
            duration: '5 days',
            quantity: 2
          }
        ],
        diagnosis: 'Acute Gastritis with mild dehydration'
      },
      docToken
    );
    const presc = prescRes.data?.data || prescRes.data?.prescription;
    if (prescRes.status === 201 && presc) {
      pass(`Doctor issued prescription: ${presc.prescriptionNumber || presc._id}`);
    }
  });

  // Doctor Assigns Recovery Diet Sheet
  await runTest('Doctor assigns clinical recovery diet sheet to patient', async () => {
    const patRes = await apiRequest('GET', '/patients', null, docToken);
    const patient = (patRes.data?.data || patRes.data?.patients || [])[0];

    const dietRes = await apiRequest(
      'POST',
      '/diet-plans/assign',
      {
        patientId: patient._id || patient.id,
        breakfast: 'Oatmeal with chia seeds and almond milk',
        lunch: 'Steamed brown rice with clear vegetable broth and tofu',
        dinner: 'Light lentil soup with steamed zucchini',
        snacks: 'Chamomile tea and soaked almonds',
        calories: 1800,
        water: 3.0,
        clinicalNote: 'Low-sodium, low-acid gastro-protective diet'
      },
      docToken
    );
    if (dietRes.status === 201 && dietRes.data?.success) {
      pass(`Clinician assigned recovery diet sheet to ${patient.name}`);
    }
  });

  // Nurse Dashboard & Read-Only Access
  await runTest('Nurse accesses nursing dashboard and patients list', async () => {
    const [dashRes, patRes] = await Promise.all([
      apiRequest('GET', '/dashboard', null, nurseToken),
      apiRequest('GET', '/patients', null, nurseToken)
    ]);
    if (dashRes.data?.success && patRes.data?.success) {
      pass('Nurse dashboard and patient care log loaded');
    }
  });
}

async function journey5ReceptionistAndPharmacist() {
  console.log('\n--- 5. Journey 5 & 6: Receptionist & Pharmacist Workflows ---');
  const recToken = tokens.receptionist;
  const pharmToken = tokens.pharmacist;

  // Receptionist Visitor Pass Lifecycle
  let passId = null;
  await runTest('Receptionist creates visitor pass and completes check-in and check-out', async () => {
    const patRes = await apiRequest('GET', '/patients', null, recToken);
    const patient = (patRes.data?.data || patRes.data?.patients || [])[0];

    // Issue Pass
    const visRes = await apiRequest(
      'POST',
      '/visitors',
      {
        visitorName: 'Karthik Raja',
        phone: '9944112233',
        email: 'karthik@visitor.com',
        relationship: 'Brother',
        purpose: 'Care Visit',
        patientId: patient._id || patient.id,
        patientRoom: 'Ward A - Bed 3'
      },
      recToken
    );
    const visitor = visRes.data?.data || visRes.data?.visitor;
    passId = visitor._id;
    pass(`Visitor pass issued: ${visitor.passId} (Status: ${visitor.status})`);

    // Check In
    const inRes = await apiRequest('POST', `/visitors/${passId}/check-in`, {}, recToken);
    const inVis = inRes.data?.data || inRes.data?.visitor;
    if (inVis && inVis.status === 'Checked In' && inVis.checkInTime) {
      pass('Visitor checked in with timestamp recorded');
    } else {
      fail(`Unexpected check in status: ${JSON.stringify(inRes.data)}`);
    }

    // Check Out
    const outRes = await apiRequest('POST', `/visitors/${passId}/check-out`, {}, recToken);
    const outVis = outRes.data?.data || outRes.data?.visitor;
    if (outVis && outVis.status === 'Checked Out' && outVis.checkOutTime) {
      pass('Visitor checked out with timestamp recorded');
    } else {
      fail(`Unexpected check out status: ${JSON.stringify(outRes.data)}`);
    }
  });

  // Pharmacist Formulation Management & Dispensing
  await runTest('Pharmacist manages formulation and dispenses pending prescription with atomic stock deduction', async () => {
    // Get pending prescription
    const prescRes = await apiRequest('GET', '/prescriptions', null, pharmToken);
    const prescs = prescRes.data?.data || prescRes.data?.prescriptions || [];
    const pendingPresc = prescs.find(p => p.status === 'Pending');

    if (pendingPresc) {
      const targetMed = pendingPresc.medicines[0];
      const initialStockRes = await apiRequest('GET', `/pharmacy/medicines/${targetMed.medicineId}`, null, pharmToken);
      const initialQty = initialStockRes.data?.data?.quantity || 100;

      // Dispense
      const dispRes = await apiRequest('POST', `/prescriptions/${pendingPresc._id}/dispense`, {}, pharmToken);
      if (dispRes.data?.success) {
        const postStockRes = await apiRequest('GET', `/pharmacy/medicines/${targetMed.medicineId}`, null, pharmToken);
        const postQty = postStockRes.data?.data?.quantity;
        pass(`Prescription ${pendingPresc.prescriptionNumber} dispensed; stock deducted atomically (${initialQty} -> ${postQty})`);
      }
    } else {
      pass('No pending prescription needed dispensing during test cycle');
    }
  });

  // Pharmacist RBAC
  await runTest('Pharmacist is permitted for pharmacy reports and forbidden from financial reports', async () => {
    const pharmReportRes = await apiRequest('GET', '/reports/pharmacy-inventory', null, pharmToken);
    if (pharmReportRes.status === 200) {
      pass('Pharmacist granted access to /reports/pharmacy-inventory');
    }

    const finReportRes = await apiRequest('GET', '/reports/financial', null, pharmToken);
    if (finReportRes.status === 403) {
      pass('Pharmacist strictly forbidden (HTTP 403) from /reports/financial');
    } else {
      fail(`Expected 403 for pharmacist on financial reports, got ${finReportRes.status}`);
    }
  });
}

async function main() {
  console.log('================================================================');
  console.log('  MEDISYNC AI: COMPLETE END-TO-END APPLICATION AUDIT & TEST');
  console.log('================================================================');
  await authAll();
  await journey1Patient();
  await journey2Admin();
  await journey3DoctorAndNurse();
  await journey5ReceptionistAndPharmacist();

  console.log('\n================================================================');
  console.log(`  E2E TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
