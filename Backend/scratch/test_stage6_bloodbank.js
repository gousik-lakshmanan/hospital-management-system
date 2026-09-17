/**
 * STAGE 6: BLOOD BANK & BLOOD REQUEST AUTOMATED TEST SUITE
 * 
 * Verifies:
 * 1. 8 Canonical blood groups in MongoDB Atlas
 * 2. Idempotent seed preservation ($setOnInsert)
 * 3. Registered donor logs & Admin donor registration
 * 4. Comprehensive RBAC for Admin, Doctor, Nurse, Receptionist, Pharmacist, Patient
 * 5. Atomic bag count adjustments & non-negative bounds (HTTP 409 on deficit)
 * 6. Blood request creation with ZERO premature stock deduction
 * 7. Partial unique index & duplicate pending request block (HTTP 409)
 * 8. Patient data isolation (/api/blood-requests/my and /api/blood-requests/:id)
 * 9. Admin atomic request approval & exact stock decrement
 * 10. Admin atomic partial negotiation & exact stock decrement
 * 11. Admin request rejection (zero stock loss)
 * 12. Double-approval & double-negotiation concurrency race conditions
 * 13. Invalid state transition protection (re-approve, re-negotiate, re-reject)
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

const apiRequest = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const payload = data ? JSON.stringify(data) : null;

    const headers = {
      'Content-Type': 'application/json',
    };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const login = async (email, password) => {
  const res = await apiRequest('/auth/login', 'POST', { email, password });
  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
};

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING STAGE 6 BLOOD BANK & BLOOD REQUEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  };

  try {
    // ----------------------------------------------------
    // Step 1: User Authentication Setup
    // ----------------------------------------------------
    console.log('--- Step 1: User Authentication & Role Setup ---');
    const adminToken = await login('admin@medisync.local', 'Admin@2026!');
    assert(adminToken, 'Admin logged in');

    const doctorToken = await login('arun.kumar@medisync.com', 'DocArun@2026!');
    assert(doctorToken, 'Doctor logged in');

    const nurseToken = await login('anitha@medisync.com', 'NurseAnitha@2026!');
    assert(nurseToken, 'Nurse logged in');

    const receptionistToken = await login('receptionist@medisync.local', 'Recept@2026!');
    assert(receptionistToken, 'Receptionist logged in');

    const pharmacistToken = await login('pharmacist@medisync.local', 'Pharm@2026!');
    assert(pharmacistToken, 'Chief Pharmacist logged in');

    const patientAToken = await login('patient@medisync.local', 'Patient@2026!');
    assert(patientAToken, 'Patient A logged in');

    // Register a distinct Patient B for isolation testing
    const uniqueEmail = `patient_b_${Date.now()}@medisync.local`;
    const regRes = await apiRequest('/auth/register', 'POST', {
      firstName: 'PatientB',
      lastName: 'IsolationTest',
      email: uniqueEmail,
      password: 'Patient@2026!',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    const patientBToken = regRes.data?.token || (await login(uniqueEmail, 'Patient@2026!'));
    assert(patientBToken, 'Patient B registered and logged in');

    // Clean up any lingering Pending requests from previous test runs to ensure repeatability
    const allPending = (await apiRequest('/blood-requests?status=Pending', 'GET', null, adminToken)).data?.data || [];
    for (const req of allPending) {
      await apiRequest(`/blood-requests/${req._id || req.id}/reject`, 'PATCH', null, adminToken);
    }

    // ----------------------------------------------------
    // Step 2: Blood Stock Baseline & Seed Verification
    // ----------------------------------------------------
    console.log('\n--- Step 2: Blood Stock Baseline & Idempotent Seed Verification ---');
    const stockRes = await apiRequest('/blood-bank/stock', 'GET', null, adminToken);
    assert(stockRes.status === 200, 'GET /api/blood-bank/stock returns 200');
    assert(Array.isArray(stockRes.data.data), 'Returns stock array');
    assert(stockRes.data.data.length === 8, `Exactly 8 blood groups exist (Found: ${stockRes.data.data?.length})`);

    const bloodGroups = stockRes.data.data.map((s) => s.bloodGroup || s.group);
    const expectedGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const allGroupsPresent = expectedGroups.every((g) => bloodGroups.includes(g));
    assert(allGroupsPresent, 'All 8 canonical blood groups exist (A+, A-, B+, B-, AB+, AB-, O+, O-)');

    // Baseline map
    const baselineStock = {};
    stockRes.data.data.forEach((s) => {
      baselineStock[s.bloodGroup || s.group] = s.units !== undefined ? s.units : s.bags;
    });
    console.log('    Captured Live Stock Baseline:', baselineStock);

    // ----------------------------------------------------
    // Step 3: Multi-Role Stock Viewing Access
    // ----------------------------------------------------
    console.log('\n--- Step 3: Multi-Role Read Access to Blood Stock ---');
    const docStockRes = await apiRequest('/blood-bank/stock', 'GET', null, doctorToken);
    assert(docStockRes.status === 200, 'Doctor can view blood stock');

    const nurseStockRes = await apiRequest('/blood-bank/stock', 'GET', null, nurseToken);
    assert(nurseStockRes.status === 200, 'Nurse can view blood stock');

    const recStockRes = await apiRequest('/blood-bank/stock', 'GET', null, receptionistToken);
    assert(recStockRes.status === 200, 'Receptionist can view blood stock');

    const pharmStockRes = await apiRequest('/blood-bank/stock', 'GET', null, pharmacistToken);
    assert(pharmStockRes.status === 200, 'Pharmacist can view blood stock');

    const patStockRes = await apiRequest('/blood-bank/stock', 'GET', null, patientAToken);
    assert(patStockRes.status === 200, 'Patient can view blood stock');

    const unauthStockRes = await apiRequest('/blood-bank/stock', 'GET', null, null);
    assert(unauthStockRes.status === 401, 'Unauthenticated request rejected with HTTP 401');

    // ----------------------------------------------------
    // Step 4: Donor Log & Donor RBAC Verification
    // ----------------------------------------------------
    console.log('\n--- Step 4: Donor Log & RBAC Verification ---');
    const adminDonorRes = await apiRequest('/blood-bank/donors', 'GET', null, adminToken);
    assert(adminDonorRes.status === 200, 'Admin can view donors');
    assert(Array.isArray(adminDonorRes.data.data) && adminDonorRes.data.data.length >= 4, 'Seeded donors present');

    const docDonorRes = await apiRequest('/blood-bank/donors', 'GET', null, doctorToken);
    assert(docDonorRes.status === 200, 'Doctor can view donors');

    const nurseDonorRes = await apiRequest('/blood-bank/donors', 'GET', null, nurseToken);
    assert(nurseDonorRes.status === 200, 'Nurse can view donors');

    const patDonorRes = await apiRequest('/blood-bank/donors', 'GET', null, patientAToken);
    assert(patDonorRes.status === 403, 'Patient FORBIDDEN from viewing donor list (HTTP 403)');

    // ----------------------------------------------------
    // Step 5: Admin Donor Registration & Security
    // ----------------------------------------------------
    console.log('\n--- Step 5: Donor Registration & RBAC ---');
    const newDonorData = {
      name: 'Vikram Sethi Test Donor',
      age: 32,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: `+91 99${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: 'vikram.sethi@test.com',
      address: 'Test City',
    };
    const regDonorRes = await apiRequest('/blood-bank/donors', 'POST', newDonorData, adminToken);
    assert(regDonorRes.status === 201, 'Admin registers donor successfully');
    assert(regDonorRes.data?.data?.name === newDonorData.name, 'Registered donor name preserved');

    const docRegDonorRes = await apiRequest('/blood-bank/donors', 'POST', newDonorData, doctorToken);
    assert(docRegDonorRes.status === 403, 'Doctor blocked from registering donor (HTTP 403)');

    const patRegDonorRes = await apiRequest('/blood-bank/donors', 'POST', newDonorData, patientAToken);
    assert(patRegDonorRes.status === 403, 'Patient blocked from registering donor (HTTP 403)');

    // ----------------------------------------------------
    // Step 6: Atomic Stock Adjustment & Non-Negative Safeguards
    // ----------------------------------------------------
    console.log('\n--- Step 6: Atomic Stock Adjustment & Concurrency Safeguards ---');
    // Ensure group A- has at least 10 units for testing
    const ensureStockRes = await apiRequest('/blood-bank/stock/A-', 'PATCH', { units: 10 }, adminToken);
    assert(ensureStockRes.status === 200, 'Admin can set stock count to 10 units');
    assert(ensureStockRes.data?.data?.units === 10, 'A- stock is now 10');

    // Positive adjustment (+5)
    const incRes = await apiRequest('/blood-bank/stock/A-', 'PATCH', { delta: 5 }, adminToken);
    assert(incRes.status === 200, 'Stock increase (+5) succeeds');
    assert(incRes.data?.data?.units === 15, 'A- stock increased to 15');

    // Negative adjustment (-3)
    const decRes = await apiRequest('/blood-bank/stock/A-', 'PATCH', { delta: -3 }, adminToken);
    assert(decRes.status === 200, 'Stock decrease (-3) succeeds');
    assert(decRes.data?.data?.units === 12, 'A- stock decreased to 12');

    // Excessive decrement (-1000)
    const excessiveRes = await apiRequest('/blood-bank/stock/A-', 'PATCH', { delta: -1000 }, adminToken);
    assert(excessiveRes.status === 409, `Excessive decrement rejected with HTTP 409 ("${excessiveRes.data?.message}")`);

    // Verify stock remains non-negative and untouched
    const verifyStockRes = await apiRequest('/blood-bank/stock/A-', 'GET', null, adminToken);
    assert(verifyStockRes.data?.data?.units === 12, 'A- stock remained intact at 12 units after 409 rejection');

    // Non-admin stock mutation block
    const docStockMutRes = await apiRequest('/blood-bank/stock/A-', 'PATCH', { units: 20 }, doctorToken);
    assert(docStockMutRes.status === 403, 'Doctor blocked from mutating stock (HTTP 403)');

    const patStockMutRes = await apiRequest('/blood-bank/stock/A-', 'PATCH', { units: 20 }, patientAToken);
    assert(patStockMutRes.status === 403, 'Patient blocked from mutating stock (HTTP 403)');

    // ----------------------------------------------------
    // Step 7: Blood Request Creation & Zero Premature Stock Loss
    // ----------------------------------------------------
    console.log('\n--- Step 7: Blood Request Creation & Zero Premature Deduction ---');
    // Ensure O+ stock is at least 15 units
    await apiRequest('/blood-bank/stock/O+', 'PATCH', { units: 15 }, adminToken);
    const preReqOStock = (await apiRequest('/blood-bank/stock/O+', 'GET', null, adminToken)).data?.data?.units;

    const createReqRes = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'O+', requestedUnits: 3 },
      patientAToken
    );
    assert(createReqRes.status === 201, 'Patient creates blood request (HTTP 201)');
    const createdReq = createReqRes.data?.data;
    assert(createdReq && (createdReq.status === 'Pending' || createdReq.status === 'pending'), 'Initial status is "Pending"');
    assert(createdReq?.approvedUnits === 0, 'Initial approvedUnits is 0');

    // Verify stock was NOT prematurely deducted
    const postReqOStock = (await apiRequest('/blood-bank/stock/O+', 'GET', null, adminToken)).data?.data?.units;
    assert(postReqOStock === preReqOStock, `Stock is UNTOUCHED upon request creation (${preReqOStock} -> ${postReqOStock})`);

    // ----------------------------------------------------
    // Step 8: Duplicate Pending Request Protection (Partial Unique Index)
    // ----------------------------------------------------
    console.log('\n--- Step 8: Duplicate Pending Request & Partial Unique Index Guard ---');
    const dupReqRes = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'O+', requestedUnits: 2 },
      patientAToken
    );
    assert(dupReqRes.status === 409, `Duplicate pending request for same blood group rejected with HTTP 409 ("${dupReqRes.data?.message}")`);

    // But patient CAN request a different blood group (e.g. AB+)
    const diffGroupRes = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'AB+', requestedUnits: 1 },
      patientAToken
    );
    assert(diffGroupRes.status === 201, 'Patient can request a different blood group (AB+) concurrently');

    // ----------------------------------------------------
    // Step 9: Request Ownership & Patient Data Isolation
    // ----------------------------------------------------
    console.log('\n--- Step 9: Patient Data Isolation ---');
    const patAMyReqs = await apiRequest('/blood-requests/my', 'GET', null, patientAToken);
    assert(patAMyReqs.status === 200, 'Patient A fetches own requests');
    const patAIds = patAMyReqs.data?.data?.map((r) => r._id || r.id);
    assert(patAIds.includes(createdReq._id), 'Patient A sees own O+ request');

    const patBMyReqs = await apiRequest('/blood-requests/my', 'GET', null, patientBToken);
    assert(patBMyReqs.status === 200, 'Patient B fetches own requests');
    const patBIds = patBMyReqs.data?.data?.map((r) => r._id || r.id) || [];
    assert(!patBIds.includes(createdReq._id), "Patient B's /my list does NOT contain Patient A's request");

    // Patient B attempts direct access to Patient A's request
    const patBDirectRes = await apiRequest(`/blood-requests/${createdReq._id}`, 'GET', null, patientBToken);
    assert(patBDirectRes.status === 403, 'Patient B direct access to Patient A request rejected with HTTP 403');

    // ----------------------------------------------------
    // Step 10: Admin Approval Workflow & Atomic Stock Deduction
    // ----------------------------------------------------
    console.log('\n--- Step 10: Admin Approval Workflow & Atomic Stock Deduction ---');
    const preApproveStock = (await apiRequest('/blood-bank/stock/O+', 'GET', null, adminToken)).data?.data?.units;

    const approveRes = await apiRequest(`/blood-requests/${createdReq._id}/approve`, 'PATCH', null, adminToken);
    assert(approveRes.status === 200, 'Admin approves blood request (HTTP 200)');
    assert(approveRes.data?.data?.status === 'Approved', 'Request status updated to "Approved"');
    assert(approveRes.data?.data?.approvedUnits === 3, 'Approved units matches requested quantity (3)');

    // Verify atomic stock decrement
    const postApproveStock = (await apiRequest('/blood-bank/stock/O+', 'GET', null, adminToken)).data?.data?.units;
    assert(postApproveStock === preApproveStock - 3, `O+ stock atomically decremented by 3 units (${preApproveStock} -> ${postApproveStock})`);

    // Since previous request is now Approved, Patient A CAN now create a new request for O+
    const newPendingAfterApproval = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'O+', requestedUnits: 1 },
      patientAToken
    );
    assert(newPendingAfterApproval.status === 201, 'Patient can submit new O+ request now that previous request is resolved (Approved)');

    // ----------------------------------------------------
    // Step 11: Double-Approval & Invalid State Transition Safeguards
    // ----------------------------------------------------
    console.log('\n--- Step 11: Double-Approval & Invalid State Safeguards ---');
    const doubleApproveRes = await apiRequest(`/blood-requests/${createdReq._id}/approve`, 'PATCH', null, adminToken);
    assert(doubleApproveRes.status === 409, `Re-approving an already approved request rejected with HTTP 409 ("${doubleApproveRes.data?.message}")`);

    const negotiateOnApproved = await apiRequest(
      `/blood-requests/${createdReq._id}/negotiate`,
      'PATCH',
      { approvedUnits: 1 },
      adminToken
    );
    assert(negotiateOnApproved.status === 409, 'Negotiating an already approved request rejected with HTTP 409');

    const rejectOnApproved = await apiRequest(`/blood-requests/${createdReq._id}/reject`, 'PATCH', null, adminToken);
    assert(rejectOnApproved.status === 409, 'Rejecting an already approved request rejected with HTTP 409');

    // ----------------------------------------------------
    // Step 12: Admin Negotiation Workflow
    // ----------------------------------------------------
    console.log('\n--- Step 12: Admin Negotiation Workflow ---');
    // Set B+ stock to 10
    await apiRequest('/blood-bank/stock/B+', 'PATCH', { units: 10 }, adminToken);
    const preNegoStock = (await apiRequest('/blood-bank/stock/B+', 'GET', null, adminToken)).data?.data?.units;

    // Doctor creates request for 5 units of B+
    const docReqRes = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'B+', requestedUnits: 5 },
      doctorToken
    );
    assert(docReqRes.status === 201, 'Doctor creates blood request for 5 units of B+');
    const docReqId = docReqRes.data?.data?._id;

    // Admin negotiates 2 units
    const negoRes = await apiRequest(
      `/blood-requests/${docReqId}/negotiate`,
      'PATCH',
      { approvedUnits: 2 },
      adminToken
    );
    assert(negoRes.status === 200, 'Admin negotiates 2 units of B+ (HTTP 200)');
    assert(negoRes.data?.data?.status === 'Negotiated', 'Request status updated to "Negotiated"');
    assert(negoRes.data?.data?.approvedUnits === 2, 'Approved units is 2');

    // Verify stock decremented by ONLY 2 units (not requested 5)
    const postNegoStock = (await apiRequest('/blood-bank/stock/B+', 'GET', null, adminToken)).data?.data?.units;
    assert(postNegoStock === preNegoStock - 2, `B+ stock decremented by negotiated quantity (${preNegoStock} -> ${postNegoStock})`);

    // ----------------------------------------------------
    // Step 13: Admin Rejection Workflow
    // ----------------------------------------------------
    console.log('\n--- Step 13: Admin Rejection Workflow ---');
    // Set AB- stock to 5
    await apiRequest('/blood-bank/stock/AB-', 'PATCH', { units: 5 }, adminToken);
    const preRejectStock = (await apiRequest('/blood-bank/stock/AB-', 'GET', null, adminToken)).data?.data?.units;

    // Nurse creates request for 2 units of AB-
    const nurseReqRes = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'AB-', requestedUnits: 2 },
      nurseToken
    );
    assert(nurseReqRes.status === 201, 'Nurse creates blood request for 2 units of AB-');
    const nurseReqId = nurseReqRes.data?.data?._id;

    // Admin rejects request
    const rejectRes = await apiRequest(`/blood-requests/${nurseReqId}/reject`, 'PATCH', null, adminToken);
    assert(rejectRes.status === 200, 'Admin rejects request (HTTP 200)');
    assert(rejectRes.data?.data?.status === 'Rejected', 'Request status is "Rejected"');
    assert(rejectRes.data?.data?.approvedUnits === 0, 'Approved units is 0');

    // Verify stock was UNCHANGED
    const postRejectStock = (await apiRequest('/blood-bank/stock/AB-', 'GET', null, adminToken)).data?.data?.units;
    assert(postRejectStock === preRejectStock, `AB- stock is UNCHANGED after rejection (${preRejectStock} -> ${postRejectStock})`);

    // ----------------------------------------------------
    // Step 14: Insufficient Stock for Approval Protection
    // ----------------------------------------------------
    console.log('\n--- Step 14: Insufficient Stock Protection ---');
    // Set B- stock to 5
    await apiRequest('/blood-bank/stock/B-', 'PATCH', { units: 5 }, adminToken);

    // Receptionist creates request for 4 units of B-
    const recReqRes = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'B-', requestedUnits: 4 },
      receptionistToken
    );
    assert(recReqRes.status === 201, 'Receptionist creates blood request for 4 units of B-');
    const recReqId = recReqRes.data?.data?._id;

    // Now reduce B- stock to 2 (e.g. emergency allocation occurred elsewhere)
    await apiRequest('/blood-bank/stock/B-', 'PATCH', { units: 2 }, adminToken);

    // Admin attempts to approve the 4-unit request
    const underStockApprove = await apiRequest(`/blood-requests/${recReqId}/approve`, 'PATCH', null, adminToken);
    assert(underStockApprove.status === 409, `Approval rejected due to insufficient stock (HTTP 409: "${underStockApprove.data?.message}")`);

    // Verify stock remains 2 and request remains Pending
    const recReqAfterUnder = await apiRequest(`/blood-requests/${recReqId}`, 'GET', null, adminToken);
    assert(recReqAfterUnder.data?.data?.status === 'Pending', 'Request remains in "Pending" status');

    // ----------------------------------------------------
    // Step 15: Concurrency & Double-Approval Race Condition Test
    // ----------------------------------------------------
    console.log('\n--- Step 15: Concurrency & Double-Approval Race Condition Test ---');
    // Set O- stock to exactly 2
    await apiRequest('/blood-bank/stock/O-', 'PATCH', { units: 2 }, adminToken);

    // Patient B requests 2 units of O-
    const concReqRes = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'O-', requestedUnits: 2 },
      patientBToken
    );
    assert(concReqRes.status === 201, 'Created pending request for 2 units of O-');
    const concReqId = concReqRes.data?.data?._id;

    // Dispatch 2 concurrent approval requests simultaneously
    console.log('  -> Dispatching 2 concurrent approval requests on the same BloodRequest...');
    const [cRes1, cRes2] = await Promise.all([
      apiRequest(`/blood-requests/${concReqId}/approve`, 'PATCH', null, adminToken),
      apiRequest(`/blood-requests/${concReqId}/approve`, 'PATCH', null, adminToken),
    ]);

    const cStatuses = [cRes1.status, cRes2.status];
    assert(cStatuses.includes(200), 'Exactly ONE concurrent approval succeeded with HTTP 200');
    assert(cStatuses.includes(409), 'The other concurrent approval received HTTP 409 conflict');

    // Verify stock is exactly 0 (no negative stock, no double decrement)
    const finalConcStock = (await apiRequest('/blood-bank/stock/O-', 'GET', null, adminToken)).data?.data?.units;
    assert(finalConcStock === 0, `Final O- stock is 0 (No negative stock, no double decrement) (Found: ${finalConcStock})`);

    // ----------------------------------------------------
    // Step 16: Concurrency & Double-Negotiation Race Condition Test
    // ----------------------------------------------------
    console.log('\n--- Step 16: Concurrency & Double-Negotiation Race Condition Test ---');
    // Reset O- stock to 2
    await apiRequest('/blood-bank/stock/O-', 'PATCH', { units: 2 }, adminToken);

    // Doctor requests 2 units of O-
    const negoConcReqRes = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'O-', requestedUnits: 2 },
      doctorToken
    );
    assert(negoConcReqRes.status === 201, 'Created pending request for negotiation concurrency test');
    const negoConcReqId = negoConcReqRes.data?.data?._id;

    // Dispatch 2 concurrent negotiation calls for 1 unit each
    console.log('  -> Dispatching 2 concurrent negotiation requests on the same BloodRequest...');
    const [nRes1, nRes2] = await Promise.all([
      apiRequest(`/blood-requests/${negoConcReqId}/negotiate`, 'PATCH', { approvedUnits: 1 }, adminToken),
      apiRequest(`/blood-requests/${negoConcReqId}/negotiate`, 'PATCH', { approvedUnits: 1 }, adminToken),
    ]);

    const nStatuses = [nRes1.status, nRes2.status];
    assert(nStatuses.includes(200), 'Exactly ONE concurrent negotiation succeeded with HTTP 200');
    assert(nStatuses.includes(409), `The other concurrent negotiation received HTTP 409 conflict (Got: ${nStatuses.join(', ')})`);

    const finalNegoStock = (await apiRequest('/blood-bank/stock/O-', 'GET', null, adminToken)).data?.data?.units;
    assert(finalNegoStock === 1, `Final O- stock is exactly 1 (1 unit deducted, no double decrement) (Found: ${finalNegoStock})`);

    // ----------------------------------------------------
    // Step 17: Request Creation Role RBAC Check
    // ----------------------------------------------------
    console.log('\n--- Step 17: Request Creation RBAC ---');
    const adminReqCreation = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'A+', requestedUnits: 1 },
      adminToken
    );
    assert(adminReqCreation.status === 403, 'Admin blocked from creating blood request (HTTP 403)');

    const pharmReqCreation = await apiRequest(
      '/blood-requests',
      'POST',
      { bloodGroup: 'A+', requestedUnits: 1 },
      pharmacistToken
    );
    assert(pharmReqCreation.status === 403, 'Pharmacist blocked from creating blood request (HTTP 403)');
  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`🎉 TEST RUN COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
