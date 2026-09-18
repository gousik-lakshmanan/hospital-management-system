const API_URL = 'http://localhost:5000/api';

const ADMIN_CRED = {
  email: 'admin@medisync.local',
  password: 'Admin@2026!',
};

const PHARMACIST_CRED = {
  email: 'pharmacist@medisync.local',
  password: 'Pharm@2026!',
};

const DOCTOR_CRED = {
  email: 'arun.kumar@medisync.com',
  password: 'DocArun@2026!',
};

const NURSE_CRED = {
  email: 'anitha@medisync.com',
  password: 'NurseAnitha@2026!',
};

const RECEPTIONIST_CRED = {
  email: 'receptionist@medisync.local',
  password: 'Recept@2026!',
};

const PATIENT_CRED = {
  email: 'patient@medisync.local',
  password: 'Patient@2026!',
};

let adminToken = '';
let pharmacistToken = '';
let doctorToken = '';
let nurseToken = '';
let receptionistToken = '';
let patientToken = '';
let patientUser = null;
let doctorUser = null;

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

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(fullUrl, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING STAGE 5 PHARMACY & PRESCRIPTION SUITE');
  console.log('======================================================\n');

  try {
    // 1. Authenticate users
    console.log('--- Step 1: User Authentication & Role Setup ---');
    const adminRes = await req('/auth/login', { method: 'POST', body: ADMIN_CRED });
    adminToken = adminRes.data?.token;
    assert(adminToken, 'Admin logged in');

    const pharmRes = await req('/auth/login', { method: 'POST', body: PHARMACIST_CRED });
    pharmacistToken = pharmRes.data?.token;
    assert(pharmacistToken, 'Pharmacist logged in');

    const docRes = await req('/auth/login', { method: 'POST', body: DOCTOR_CRED });
    doctorToken = docRes.data?.token;
    doctorUser = docRes.data?.user;
    assert(doctorToken, 'Doctor logged in');

    const nurseRes = await req('/auth/login', { method: 'POST', body: NURSE_CRED });
    nurseToken = nurseRes.data?.token;
    assert(nurseToken, 'Nurse logged in');

    const receptRes = await req('/auth/login', { method: 'POST', body: RECEPTIONIST_CRED });
    receptionistToken = receptRes.data?.token;
    assert(receptionistToken, 'Receptionist logged in');

    const patRes = await req('/auth/login', { method: 'POST', body: PATIENT_CRED });
    patientToken = patRes.data?.token;
    patientUser = patRes.data?.user;
    assert(patientToken, 'Patient logged in');

    const adminH = { Authorization: `Bearer ${adminToken}` };
    const pharmH = { Authorization: `Bearer ${pharmacistToken}` };
    const docH = { Authorization: `Bearer ${doctorToken}` };
    const nurseH = { Authorization: `Bearer ${nurseToken}` };
    const receptH = { Authorization: `Bearer ${receptionistToken}` };
    const patH = { Authorization: `Bearer ${patientToken}` };

    // 2. Pharmacy Seed & Directory Verification
    console.log('\n--- Step 2: Pharmacy Database Seed Verification ---');
    const medListRes = await req('/pharmacy/medicines', { headers: adminH });
    assert(medListRes.status === 200, 'GET /api/pharmacy/medicines returns 200');
    assert(medListRes.data?.data?.length >= 12, 'At least 12 medicines seeded in MongoDB', `(Found: ${medListRes.data?.data?.length})`);

    const medicines = medListRes.data?.data || [];
    const pcmMed = medicines.find(m => m.name.includes('Paracetamol'));
    const amxMed = medicines.find(m => m.name.includes('Amoxicillin'));
    const metMed = medicines.find(m => m.name.includes('Metformin'));

    assert(pcmMed && amxMed && metMed, 'Canonical formulations exist (Paracetamol, Amoxicillin, Metformin)');

    // 3. Multi-Role Read Access
    console.log('\n--- Step 3: Multi-Role Read Access to Pharmacy ---');
    const docMedRes = await req('/pharmacy/medicines', { headers: docH });
    assert(docMedRes.status === 200, 'Doctor can view medicines');

    const nurseMedRes = await req('/pharmacy/medicines', { headers: nurseH });
    assert(nurseMedRes.status === 200, 'Nurse can view medicines');

    const receptMedRes = await req('/pharmacy/medicines', { headers: receptH });
    assert(receptMedRes.status === 200, 'Receptionist can view medicines');

    const pharmMedRes = await req('/pharmacy/medicines', { headers: pharmH });
    assert(pharmMedRes.status === 200, 'Pharmacist can view medicines');

    const patMedRes = await req('/pharmacy/medicines', { headers: patH });
    assert(patMedRes.status === 200, 'Patient can view medicines');

    const unauthMedRes = await req('/pharmacy/medicines');
    assert(unauthMedRes.status === 401, 'Unauthenticated request rejected with HTTP 401');

    // 4. Medicine Creation & RBAC
    console.log('\n--- Step 4: Medicine Registration & RBAC ---');
    const newMedPayload = {
      name: `Test Med-${Date.now()}`,
      genericName: 'Test Generic Formulation',
      category: 'Tablet',
      batchNumber: `TST-${Date.now().toString().slice(-5)}`,
      expiryDate: '2028-12-31',
      quantity: 100,
      reorderLevel: 20,
      unitPrice: 50.00,
      description: 'Test formulation for automated verification',
    };

    const pharmCreateRes = await req('/pharmacy/medicines', {
      method: 'POST',
      headers: pharmH,
      body: newMedPayload,
    });
    assert(pharmCreateRes.status === 201, 'Pharmacist can register new medicine');
    const createdMedId = pharmCreateRes.data?.data?._id;

    // Doctor blocked from creating medicine
    const docCreateRes = await req('/pharmacy/medicines', {
      method: 'POST',
      headers: docH,
      body: { ...newMedPayload, name: 'Doc Forbidden Med' },
    });
    assert(docCreateRes.status === 403, 'Doctor blocked from creating medicine (HTTP 403)');

    // Patient blocked from creating medicine
    const patCreateRes = await req('/pharmacy/medicines', {
      method: 'POST',
      headers: patH,
      body: { ...newMedPayload, name: 'Patient Forbidden Med' },
    });
    assert(patCreateRes.status === 403, 'Patient blocked from creating medicine (HTTP 403)');

    // 5. Medicine Detail & Update
    console.log('\n--- Step 5: Medicine Details & Update ---');
    const detailRes = await req(`/pharmacy/medicines/${createdMedId}`, { headers: adminH });
    assert(detailRes.status === 200, 'GET /api/pharmacy/medicines/:id succeeds');
    assert(detailRes.data?.data?.name === newMedPayload.name, 'Medicine details match payload');

    const updateRes = await req(`/pharmacy/medicines/${createdMedId}`, {
      method: 'PUT',
      headers: adminH,
      body: { unitPrice: 55.00, description: 'Updated test formulation' },
    });
    assert(updateRes.status === 200, 'Admin can update medicine');
    assert(updateRes.data?.data?.unitPrice === 55.00, 'Updated unit price persisted');

    // 6. Stock Adjustment & Non-Negative Safeguards
    console.log('\n--- Step 6: Atomic Stock Adjustment & Concurrency Safeguards ---');
    const initialQty = detailRes.data?.data?.quantity || 100;

    // Increase stock (+25)
    const incRes = await req(`/pharmacy/medicines/${createdMedId}/stock`, {
      method: 'PATCH',
      headers: pharmH,
      body: { change: 25 },
    });
    assert(incRes.status === 200, 'Stock increase (+25) succeeds');
    assert(incRes.data?.data?.quantity === initialQty + 25, `New quantity is ${initialQty + 25}`);

    // Decrease stock (-15)
    const decRes = await req(`/pharmacy/medicines/${createdMedId}/stock`, {
      method: 'PATCH',
      headers: pharmH,
      body: { change: -15 },
    });
    assert(decRes.status === 200, 'Stock decrease (-15) succeeds');
    assert(decRes.data?.data?.quantity === initialQty + 10, `New quantity is ${initialQty + 10}`);

    // Excessive decrease (-9999) must fail with HTTP 409
    const excessiveDecRes = await req(`/pharmacy/medicines/${createdMedId}/stock`, {
      method: 'PATCH',
      headers: pharmH,
      body: { change: -9999 },
    });
    assert(excessiveDecRes.status === 409, 'Excessive stock decrease rejected with HTTP 409', `("${excessiveDecRes.data?.message}")`);

    // Verify stock is still positive and unchanged
    const verifyStockRes = await req(`/pharmacy/medicines/${createdMedId}`, { headers: adminH });
    assert(verifyStockRes.data?.data?.quantity === initialQty + 10, 'Stock quantity remained non-negative and untouched after 409');

    // 7. Filtering: Search, Low Stock, Expiring Soon
    console.log('\n--- Step 7: Medicine Inventory Filtering ---');
    const searchRes = await req('/pharmacy/medicines?search=paracetamol', { headers: adminH });
    assert(searchRes.status === 200, 'Search query ?search=paracetamol succeeds');
    assert(searchRes.data?.data?.every(m => m.name.toLowerCase().includes('paracetamol') || m.genericName.toLowerCase().includes('paracetamol')), 'Search results matched name/generic');

    const lowStockRes = await req('/pharmacy/medicines?lowStock=true', { headers: adminH });
    assert(lowStockRes.status === 200, 'Query ?lowStock=true succeeds');

    const expiringRes = await req('/pharmacy/medicines?expiringSoon=true', { headers: adminH });
    assert(expiringRes.status === 200, 'Query ?expiringSoon=true succeeds');

    // 8. Expired Medicine Protection
    console.log('\n--- Step 8: Expired Medicine Dispensing Protection ---');
    const expiredMedRes = await req('/pharmacy/medicines', {
      method: 'POST',
      headers: adminH,
      body: {
        name: `Expired Med-${Date.now()}`,
        genericName: 'Expired Formulation',
        category: 'Syrup',
        batchNumber: `EXP-${Date.now().toString().slice(-5)}`,
        expiryDate: '2020-01-01', // Expired
        quantity: 50,
        reorderLevel: 10,
        unitPrice: 30.00,
      },
    });
    const expiredMedId = expiredMedRes.data?.data?._id;

    // Doctor creates prescription with expired med
    const expiredPrescRes = await req('/prescriptions', {
      method: 'POST',
      headers: docH,
      body: {
        patientId: patientUser._id || patientUser.id,
        medicines: [{ medicineId: expiredMedId, quantity: 2, dosage: '1-0-1', duration: '3 days' }],
        diagnosis: 'Test Expired Handling',
      },
    });
    assert(expiredPrescRes.status === 201, 'Prescription created with status Pending');
    const expiredPrescId = expiredPrescRes.data?.data?._id;

    // Dispense attempt must fail with HTTP 409
    const dispenseExpiredRes = await req(`/prescriptions/${expiredPrescId}/dispense`, {
      method: 'PATCH',
      headers: pharmH,
    });
    assert(dispenseExpiredRes.status === 409, 'Dispensing expired medicine rejected with HTTP 409', `("${dispenseExpiredRes.data?.message}")`);

    // Clean up cancelled expired prescription
    await req(`/prescriptions/${expiredPrescId}/cancel`, { method: 'PATCH', headers: docH });

    // 9. Standard Prescription Workflow (Pending -> Dispensed)
    console.log('\n--- Step 9: Standard Prescription Lifecycle ---');
    const pcmInitialQty = pcmMed.quantity;

    const standardPrescRes = await req('/prescriptions', {
      method: 'POST',
      headers: docH,
      body: {
        patientId: patientUser._id || patientUser.id,
        medicines: [
          { medicineId: pcmMed._id, quantity: 5, dosage: '1-0-1', duration: '5 days', instructions: 'After meals' },
        ],
        diagnosis: 'Acute Viral Fever',
        instructions: 'Drink warm water and rest',
      },
    });
    assert(standardPrescRes.status === 201, 'Doctor creates prescription');
    assert(standardPrescRes.data?.data?.status === 'Pending', 'Prescription initial status is "Pending"');
    const standardPrescId = standardPrescRes.data?.data?._id;

    // Check stock was NOT deducted upon creation
    const checkStockAfterCreate = await req(`/pharmacy/medicines/${pcmMed._id}`, { headers: adminH });
    assert(checkStockAfterCreate.data?.data?.quantity === pcmInitialQty, 'Stock is UNTOUCHED upon prescription creation (No early deduction)');

    // Patient views own prescription
    const myPrescRes = await req('/prescriptions/my', { headers: patH });
    assert(myPrescRes.status === 200, 'Patient retrieves own prescriptions');
    assert(myPrescRes.data?.data?.some(p => p._id === standardPrescId), 'Created prescription appears in patient view');

    // Doctor views created prescriptions
    const docCreatedRes = await req('/prescriptions/my-created', { headers: docH });
    assert(docCreatedRes.status === 200, 'Doctor retrieves own created prescriptions');
    assert(docCreatedRes.data?.data?.some(p => p._id === standardPrescId), 'Created prescription appears in doctor view');

    // Pharmacist dispenses prescription
    const dispenseRes = await req(`/prescriptions/${standardPrescId}/dispense`, {
      method: 'PATCH',
      headers: pharmH,
    });
    assert(dispenseRes.status === 200, 'Pharmacist dispenses prescription successfully');
    assert(dispenseRes.data?.data?.status === 'Dispensed', 'Prescription status updated to "Dispensed"');
    assert(dispenseRes.data?.data?.dispensedByName.length > 0, 'DispensedBy audit snapshot recorded');

    // Verify stock is deducted by exactly 5 units
    const checkStockAfterDispense = await req(`/pharmacy/medicines/${pcmMed._id}`, { headers: adminH });
    assert(
      checkStockAfterDispense.data?.data?.quantity === pcmInitialQty - 5,
      `Stock correctly decremented by 5 units (${pcmInitialQty} -> ${pcmInitialQty - 5})`
    );

    // 10. Double-Dispense Protection
    console.log('\n--- Step 10: Double-Dispense Protection ---');
    const doubleDispenseRes = await req(`/prescriptions/${standardPrescId}/dispense`, {
      method: 'PATCH',
      headers: pharmH,
    });
    assert(doubleDispenseRes.status === 409, 'Attempting to dispense already dispensed prescription returns HTTP 409', `("${doubleDispenseRes.data?.message}")`);

    // Dispensed prescription cannot be cancelled
    const cancelDispensedRes = await req(`/prescriptions/${standardPrescId}/cancel`, {
      method: 'PATCH',
      headers: docH,
    });
    assert(cancelDispensedRes.status === 409, 'Cancelling dispensed prescription rejected with HTTP 409', `("${cancelDispensedRes.data?.message}")`);

    // 11. Multi-Medicine All-or-Nothing Atomicity Test
    console.log('\n--- Step 11: Multi-Medicine All-or-Nothing Atomicity ---');
    // Set a test med with only 2 units left
    const lowStockMedRes = await req('/pharmacy/medicines', {
      method: 'POST',
      headers: adminH,
      body: {
        name: `Low Stock Med-${Date.now()}`,
        genericName: 'Low Stock Formulation',
        category: 'Tablet',
        batchNumber: `LOW-${Date.now().toString().slice(-5)}`,
        expiryDate: '2028-12-31',
        quantity: 2, // Only 2 units
        reorderLevel: 5,
        unitPrice: 10.00,
      },
    });
    const lowStockMedId = lowStockMedRes.data?.data?._id;

    // Prescribe Paracetamol (qty: 10) AND Low Stock Med (qty: 5 -> insufficient)
    const pcmStockBeforeMulti = (await req(`/pharmacy/medicines/${pcmMed._id}`, { headers: adminH })).data?.data?.quantity;

    const multiPrescRes = await req('/prescriptions', {
      method: 'POST',
      headers: docH,
      body: {
        patientId: patientUser._id || patientUser.id,
        medicines: [
          { medicineId: pcmMed._id, quantity: 10, dosage: '1-0-1', duration: '5 days' },
          { medicineId: lowStockMedId, quantity: 5, dosage: '1-0-0', duration: '5 days' }, // Needs 5, only 2 available
        ],
        diagnosis: 'Multi-Medicine Atomicity Test',
      },
    });
    const multiPrescId = multiPrescRes.data?.data?._id;

    const multiDispenseRes = await req(`/prescriptions/${multiPrescId}/dispense`, {
      method: 'PATCH',
      headers: pharmH,
    });
    assert(multiDispenseRes.status === 409, 'Multi-medicine dispense fails with HTTP 409 due to one insufficient item', `("${multiDispenseRes.data?.message}")`);

    // Verify Paracetamol stock was NOT partially deducted
    const pcmStockAfterMulti = (await req(`/pharmacy/medicines/${pcmMed._id}`, { headers: adminH })).data?.data?.quantity;
    assert(pcmStockAfterMulti === pcmStockBeforeMulti, 'Zero partial deduction: Paracetamol stock remained unchanged');

    // Clean up multi prescription
    await req(`/prescriptions/${multiPrescId}/cancel`, { method: 'PATCH', headers: docH });

    // 12. Concurrency & Double-Dispense Race Condition Test
    console.log('\n--- Step 12: Concurrency & Double-Dispense Race Condition ---');
    const racePrescRes = await req('/prescriptions', {
      method: 'POST',
      headers: docH,
      body: {
        patientId: patientUser._id || patientUser.id,
        medicines: [{ medicineId: pcmMed._id, quantity: 2, dosage: '1-0-1', duration: '2 days' }],
        diagnosis: 'Concurrency Dispense Race Test',
      },
    });
    const racePrescId = racePrescRes.data?.data?._id;

    console.log('  -> Dispatching 2 concurrent dispense calls on the same prescription...');
    const [disp1, disp2] = await Promise.all([
      req(`/prescriptions/${racePrescId}/dispense`, { method: 'PATCH', headers: pharmH }),
      req(`/prescriptions/${racePrescId}/dispense`, { method: 'PATCH', headers: adminH }),
    ]);

    const statuses = [disp1.status, disp2.status];
    assert(statuses.includes(200), 'Exactly ONE concurrent dispense succeeded (HTTP 200)');
    assert(statuses.includes(409), 'The other concurrent dispense was rejected with HTTP 409');

    // 13. Prescription Cancellation Workflow
    console.log('\n--- Step 13: Prescription Cancellation Workflow ---');
    const toCancelRes = await req('/prescriptions', {
      method: 'POST',
      headers: docH,
      body: {
        patientId: patientUser._id || patientUser.id,
        medicines: [{ medicineId: pcmMed._id, quantity: 1, dosage: '1-0-1', duration: '1 day' }],
        diagnosis: 'Cancellation Test',
      },
    });
    const toCancelId = toCancelRes.data?.data?._id;

    const cancelRes = await req(`/prescriptions/${toCancelId}/cancel`, {
      method: 'PATCH',
      headers: docH,
    });
    assert(cancelRes.status === 200, 'Doctor successfully cancelled pending prescription');
    assert(cancelRes.data?.data?.status === 'Cancelled', 'Prescription status is "Cancelled"');

    // 14. RBAC Verification for Prescriptions
    console.log('\n--- Step 14: Comprehensive RBAC Verification ---');
    // Patient cannot create prescription
    const patCreatePresc = await req('/prescriptions', {
      method: 'POST',
      headers: patH,
      body: {
        patientId: patientUser._id || patientUser.id,
        medicines: [{ medicineId: pcmMed._id, quantity: 1 }],
      },
    });
    assert(patCreatePresc.status === 403, 'Patient forbidden from creating prescription (HTTP 403)');

    // Patient cannot dispense prescription
    const patDispense = await req(`/prescriptions/${standardPrescId}/dispense`, {
      method: 'PATCH',
      headers: patH,
    });
    assert(patDispense.status === 403, 'Patient forbidden from dispensing prescription (HTTP 403)');

    // Doctor cannot deactivate medicine
    const docDeact = await req(`/pharmacy/medicines/${createdMedId}/deactivate`, {
      method: 'PATCH',
      headers: docH,
    });
    assert(docDeact.status === 403, 'Doctor forbidden from deactivating medicine (HTTP 403)');

    console.log('\n======================================================');
    console.log(`🎉 TEST RUN COMPLETE: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Unhandled error in test suite:', error);
    process.exit(1);
  }
}

runTests();
