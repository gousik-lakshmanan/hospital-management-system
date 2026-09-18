const BASE_URL = 'http://localhost:5000/api';

const USERS = {
  admin: { email: 'admin@medisync.local', password: 'Admin@2026!' },
  receptionist: { email: 'receptionist@medisync.local', password: 'Recept@2026!' },
  doctor: { email: 'arun.kumar@medisync.com', password: 'DocArun@2026!' },
  nurse: { email: 'anitha@medisync.com', password: 'NurseAnitha@2026!' },
  pharmacist: { email: 'pharmacist@medisync.local', password: 'Pharm@2026!' },
  patient: { email: 'patient@medisync.local', password: 'Patient@2026!' }
};

const tokens = {};
let passed = 0;
let failed = 0;

const assert = (condition, testName, extra = '') => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName} ${extra}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${extra}`);
    failed++;
  }
};

const login = async (roleKey) => {
  const creds = USERS[roleKey];
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds)
  });
  const data = await res.json();
  if (data.success && data.token) {
    tokens[roleKey] = data.token;
    return data.token;
  }
  throw new Error(`Login failed for ${roleKey}: ${data.message}`);
};

const runTests = async () => {
  console.log('\n============================================================');
  console.log('🚀 STAGE 7 TEST SUITE: VISITORS + BILLING + DIET PLANNING');
  console.log('============================================================\n');

  // Step 1: Log in all roles
  console.log('--- 1. Authenticating Roles ---');
  for (const roleKey of Object.keys(USERS)) {
    try {
      await login(roleKey);
      assert(!!tokens[roleKey], `Login role [${roleKey}]`);
    } catch (e) {
      assert(false, `Login role [${roleKey}] - ${e.message}`);
    }
  }

  // Retrieve patient for tests
  const patientsRes = await fetch(`${BASE_URL}/patients`, {
    headers: { Authorization: `Bearer ${tokens.admin}` }
  });
  const patientsData = await patientsRes.json();
  const patientsList = patientsData.data || patientsData.patients || [];
  const testPatient = patientsList.length > 0 ? patientsList[0] : null;
  assert(!!testPatient, 'Retrieve test patient from database');



  // Step 2: Visitors Module Tests
  console.log('\n--- 2. Testing Visitors Module ---');
  let createdVisitor = null;
  if (testPatient) {
    // Create Visitor
    const createVisRes = await fetch(`${BASE_URL}/visitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}`
      },
      body: JSON.stringify({
        visitorName: 'Senthil Nathan',
        phone: '+91 97777 88888',
        email: 'senthil.nathan@example.com',
        relationship: 'Cousin',
        purpose: 'Ward Visit',
        patientId: testPatient._id,
        notes: 'Security clearance verified'
      })
    });
    const createVisData = await createVisRes.json();
    assert(createVisRes.status === 201 && createVisData.success, 'Receptionist creates visitor pass');
    assert(createVisData.data?.passId?.startsWith('PASS-'), 'Pass ID format is PASS-XXXXX');
    assert(createVisData.data?.status === 'Expected', 'Initial status is Expected');
    assert(createVisData.data?.checkInTime === null, 'Initial checkInTime is null');
    assert(createVisData.data?.checkOutTime === null, 'Initial checkOutTime is null');
    createdVisitor = createVisData.data;

    if (createdVisitor) {
      // Check in Visitor (Expected -> Checked In)
      const checkInRes = await fetch(`${BASE_URL}/visitors/${createdVisitor._id}/check-in`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens.receptionist}` }
      });
      const checkInData = await checkInRes.json();
      assert(checkInRes.status === 200 && checkInData.data?.status === 'Checked In', 'Check-in visitor (Expected -> Checked In)');
      assert(!!checkInData.data?.checkInTime, 'checkInTime is populated after check-in');

      // Invalid state check-in concurrency / repetition test (Checked In -> Checked In should return HTTP 409)
      const reCheckInRes = await fetch(`${BASE_URL}/visitors/${createdVisitor._id}/check-in`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens.receptionist}` }
      });
      assert(reCheckInRes.status === 409, 'Duplicate check-in rejected with HTTP 409 Conflict');

      // Check out Visitor (Checked In -> Checked Out)
      const checkOutRes = await fetch(`${BASE_URL}/visitors/${createdVisitor._id}/check-out`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens.receptionist}` }
      });
      const checkOutData = await checkOutRes.json();
      assert(checkOutRes.status === 200 && checkOutData.data?.status === 'Checked Out', 'Check-out visitor (Checked In -> Checked Out)');
      assert(!!checkOutData.data?.checkOutTime, 'checkOutTime is populated after check-out');

      // Duplicate check-out should return HTTP 409
      const reCheckOutRes = await fetch(`${BASE_URL}/visitors/${createdVisitor._id}/check-out`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens.receptionist}` }
      });
      assert(reCheckOutRes.status === 409, 'Duplicate check-out rejected with HTTP 409 Conflict');
    }

    // Create & Cancel Visitor
    const cancelVisRes = await fetch(`${BASE_URL}/visitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`
      },
      body: JSON.stringify({
        visitorName: 'Manoj Kumar',
        phone: '+91 97777 99999',
        relationship: 'Friend',
        purpose: 'Delivery',
        patientId: testPatient._id
      })
    });
    const cancelVisData = await cancelVisRes.json();
    if (cancelVisData.data) {
      const cancelRes = await fetch(`${BASE_URL}/visitors/${cancelVisData.data._id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      const cancelResData = await cancelRes.json();
      assert(cancelRes.status === 200 && cancelResData.data?.status === 'Cancelled', 'Cancel visitor pass (Expected -> Cancelled)');
    }

    // RBAC check: Pharmacist gets 403
    const pharmVisRes = await fetch(`${BASE_URL}/visitors`, {
      headers: { Authorization: `Bearer ${tokens.pharmacist}` }
    });
    assert(pharmVisRes.status === 403, 'Pharmacist forbidden from accessing visitors (HTTP 403)');

    // Patient isolation check
    const patVisRes = await fetch(`${BASE_URL}/visitors`, {
      headers: { Authorization: `Bearer ${tokens.patient}` }
    });
    const patVisData = await patVisRes.json();
    assert(patVisRes.status === 200 && Array.isArray(patVisData.data), 'Patient can query own visitor passes');
  }

  // Step 3: Billing Module Tests
  console.log('\n--- 3. Testing Billing Module ---');
  let createdBill = null;
  if (testPatient) {
    // Create Bill
    const createBillRes = await fetch(`${BASE_URL}/billing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}`
      },
      body: JSON.stringify({
        patientId: testPatient._id,
        items: [
          { description: 'Specialist Consultation', category: 'Doctor Consultation', quantity: 1, unitPrice: 1000, amount: 1000 },
          { description: 'Antibiotics Course', category: 'Pharmacy & Medication', quantity: 2, unitPrice: 250, amount: 500 }
        ],
        discount: 100,
        tax: 70,
        notes: 'Outpatient specialist consultation invoice'
      })
    });
    const createBillData = await createBillRes.json();
    assert(createBillRes.status === 201 && createBillData.success, 'Create itemized billing invoice');
    assert(createBillData.data?.invoiceNumber?.startsWith('INV-'), 'Invoice number format is INV-YYYY-XXXXXX');
    assert(createBillData.data?.subtotal === 1500, 'Subtotal correctly calculated (1500)');
    assert(createBillData.data?.totalAmount === 1470, 'Total amount correctly calculated (1500 - 100 + 70 = 1470)');
    assert(createBillData.data?.balanceAmount === 1470, 'Initial balanceAmount equals totalAmount (1470)');
    assert(createBillData.data?.paymentStatus === 'Unpaid', 'Initial paymentStatus is Unpaid');
    assert(createBillData.data?.roomCharges === undefined, 'No duplicate roomCharges field in Bill');
    createdBill = createBillData.data;

    if (createdBill) {
      // Record Partial Payment (470)
      const partPayRes = await fetch(`${BASE_URL}/billing/${createdBill._id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.receptionist}`
        },
        body: JSON.stringify({
          amount: 470,
          paymentMethod: 'UPI',
          transactionRef: 'UPI-TXN-PART-1'
        })
      });
      const partPayData = await partPayRes.json();
      assert(partPayRes.status === 200 && partPayData.data?.paymentStatus === 'Partially Paid', 'Partial payment recorded (Unpaid -> Partially Paid)');
      assert(partPayData.data?.amountPaid === 470, 'amountPaid updated to 470');
      assert(partPayData.data?.balanceAmount === 1000, 'balanceAmount updated to 1000');
      assert(partPayData.data?.paymentHistory?.length === 1, 'paymentHistory logged receipt');

      // Overpayment protection test (attempt to pay 1500 when balance is 1000)
      const overPayRes = await fetch(`${BASE_URL}/billing/${createdBill._id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.receptionist}`
        },
        body: JSON.stringify({
          amount: 1500,
          paymentMethod: 'Cash'
        })
      });
      assert(overPayRes.status === 400, 'Overpayment rejected with HTTP 400 Bad Request');

      // Record Full Remaining Payment (1000)
      const fullPayRes = await fetch(`${BASE_URL}/billing/${createdBill._id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.admin}`
        },
        body: JSON.stringify({
          amount: 1000,
          paymentMethod: 'Credit Card',
          transactionRef: 'CC-AUTH-8849'
        })
      });
      const fullPayData = await fullPayRes.json();
      assert(fullPayRes.status === 200 && fullPayData.data?.paymentStatus === 'Paid', 'Final payment recorded (Partially Paid -> Paid)');
      assert(fullPayData.data?.balanceAmount === 0, 'balanceAmount is 0');
      assert(fullPayData.data?.amountPaid === 1470, 'amountPaid equals totalAmount (1470)');

      // Payment on fully paid bill should return HTTP 400
      const paidAgainRes = await fetch(`${BASE_URL}/billing/${createdBill._id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.admin}`
        },
        body: JSON.stringify({ amount: 100 })
      });
      assert(paidAgainRes.status === 400, 'Payment on fully paid bill rejected with HTTP 400');

      // Patient attempts payment mutation -> HTTP 403 Forbidden
      const patPayRes = await fetch(`${BASE_URL}/billing/${createdBill._id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.patient}`
        },
        body: JSON.stringify({ amount: 50 })
      });
      assert(patPayRes.status === 403, 'Patient payment mutation rejected with HTTP 403 Forbidden');
    }

    // Billing Summary Endpoint (Admin/Receptionist)
    const summaryRes = await fetch(`${BASE_URL}/billing/summary`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.status === 200 && summaryData.success && summaryData.data?.totalRevenue > 0, 'Billing summary calculates aggregate revenue metrics');

    // Patient views own bills (GET /api/billing/my)
    const myBillsRes = await fetch(`${BASE_URL}/billing/my`, {
      headers: { Authorization: `Bearer ${tokens.patient}` }
    });
    const myBillsData = await myBillsRes.json();
    assert(myBillsRes.status === 200 && Array.isArray(myBillsData.data), 'Patient retrieves own bills via /api/billing/my');

    // Pharmacist forbidden access
    const pharmBillRes = await fetch(`${BASE_URL}/billing`, {
      headers: { Authorization: `Bearer ${tokens.pharmacist}` }
    });
    assert(pharmBillRes.status === 403, 'Pharmacist forbidden from billing endpoints (HTTP 403)');
  }

  // Step 4: Diet Planning Module Tests
  console.log('\n--- 4. Testing Diet Planning Module ---');
  // Patient generates diet plan
  const generateDietRes = await fetch(`${BASE_URL}/diet-plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.patient}`
    },
    body: JSON.stringify({
      age: 26,
      gender: 'female',
      height: 165,
      weight: 58,
      preference: 'vegetarian',
      allergies: ['Peanuts', 'Dairy'],
      activity: 'moderate',
      currentDisease: 'Gastritis'
    })
  });
  const generateDietData = await generateDietRes.json();
  assert(generateDietRes.status === 201 && generateDietData.success, 'Patient generates personalized diet plan');
  assert(generateDietData.data?.caloriesTarget > 0, 'Plan has valid caloriesTarget');
  assert(generateDietData.data?.waterTarget > 0, 'Plan has valid waterTarget');
  assert(Array.isArray(generateDietData.data?.weeklyMeals) && generateDietData.data.weeklyMeals.length === 7, 'Plan has complete 7-day meal matrix');
  assert(!!generateDietData.data?.todayTarget?.breakfast, 'Plan has todayTarget breakfast meal');
  assert(generateDietData.data?.streak === undefined, 'No streak field in DietPlan');

  // Patient queries today's target (GET /api/diet-plans/me/today)
  const todayRes = await fetch(`${BASE_URL}/diet-plans/me/today`, {
    headers: { Authorization: `Bearer ${tokens.patient}` }
  });
  const todayData = await todayRes.json();
  assert(todayRes.status === 200 && todayData.data?.calories > 0, 'Patient retrieves active today target');

  // Patient queries my diet plans history
  const myPlansRes = await fetch(`${BASE_URL}/diet-plans/me`, {
    headers: { Authorization: `Bearer ${tokens.patient}` }
  });
  const myPlansData = await myPlansRes.json();
  assert(myPlansRes.status === 200 && Array.isArray(myPlansData.data) && myPlansData.data.length > 0, 'Patient retrieves personal diet plans history');

  // Doctor/Nurse assigns diet sheet to patient
  if (testPatient) {
    const assignDietRes = await fetch(`${BASE_URL}/diet-plans/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.doctor}`
      },
      body: JSON.stringify({
        patientId: testPatient._id,
        breakfast: 'Oatmeal with boiled egg whites & papaya',
        lunch: 'Brown rice with spinach dal & steamed veggies',
        dinner: 'Moong soup with 2 phulkas',
        snacks: 'Coconut water and walnuts',
        calories: '1900',
        water: '3.0',
        clinicalNote: 'High protein recovery diet for post-op healing'
      })
    });
    const assignDietData = await assignDietRes.json();
    assert(assignDietRes.status === 201 && assignDietData.data?.source === 'CLINICAL_ASSIGNED', 'Doctor assigns clinical diet sheet to patient');

    // Doctor browses diet directory
    const dirRes = await fetch(`${BASE_URL}/diet-plans`, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    const dirData = await dirRes.json();
    assert(dirRes.status === 200 && Array.isArray(dirData.data) && dirData.data.length > 0, 'Doctor browses diet plans directory');
  }

  console.log('\n============================================================');
  console.log(`🏁 TEST SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
