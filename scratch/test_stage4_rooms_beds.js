const API_URL = 'http://localhost:5000/api';

const ADMIN_CRED = {
  email: 'admin@medisync.local',
  password: 'Admin@2026!',
};

const PATIENT_CRED = {
  email: 'patient@medisync.local',
  password: 'Patient@2026!',
};

const DOCTOR_CRED = {
  email: 'arun.kumar@medisync.com',
  password: 'DocArun@2026!',
};

let adminToken = '';
let patientToken = '';
let doctorToken = '';
let patientUser = null;

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
  console.log('🚀 RUNNING STAGE 4 ROOMS & BEDS SUITE');
  console.log('======================================================\n');

  try {
    // 1. Authenticate users
    console.log('--- Step 1: Authentication & Token Retrieval ---');
    const adminRes = await req('/auth/login', { method: 'POST', body: ADMIN_CRED });
    adminToken = adminRes.data?.token;
    assert(adminToken, 'Admin logged in successfully');

    const patientRes = await req('/auth/login', { method: 'POST', body: PATIENT_CRED });
    patientToken = patientRes.data?.token;
    patientUser = patientRes.data?.user;
    assert(patientToken, 'Patient logged in successfully');

    const docRes = await req('/auth/login', { method: 'POST', body: DOCTOR_CRED });
    doctorToken = docRes.data?.token;
    assert(doctorToken, 'Doctor logged in successfully');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const patientHeaders = { Authorization: `Bearer ${patientToken}` };
    const doctorHeaders = { Authorization: `Bearer ${doctorToken}` };

    // 2. Room & Bed Seed Verification
    console.log('\n--- Step 2: Room & Bed Database Seed Verification ---');
    const roomsRes = await req('/rooms', { headers: adminHeaders });
    const rooms = roomsRes.data?.data || [];
    assert(rooms.length === 6, 'Exactly 6 rooms exist in MongoDB Atlas', `(Found: ${rooms.length})`);

    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    assert(totalCapacity === 33, 'Total hospital bed capacity is 33 spaces', `(Found: ${totalCapacity})`);

    const roomIds = rooms.map(r => r.roomId);
    assert(
      roomIds.includes('WD-201') &&
      roomIds.includes('EMR-101') &&
      roomIds.includes('ICU-101') &&
      roomIds.includes('PS-101') &&
      roomIds.includes('PS-102') &&
      roomIds.includes('PS-103'),
      'All 6 canonical room IDs exist (WD-201, EMR-101, ICU-101, PS-101, PS-102, PS-103)'
    );

    // Dynamic stats check
    const icuRoom = rooms.find(r => r.roomId === 'ICU-101');
    assert(
      icuRoom.capacity === icuRoom.occupied + icuRoom.available,
      'Dynamic room stats are mathematically consistent (capacity = occupied + available)',
      `(${icuRoom.capacity} = ${icuRoom.occupied} + ${icuRoom.available})`
    );

    // 3. Beds by Room & Available Beds Endpoint
    console.log('\n--- Step 3: Room Beds & Available Beds API ---');
    const icuBedsRes = await req('/rooms/ICU-101/beds', { headers: adminHeaders });
    assert(icuBedsRes.data?.data?.length === 10, 'ICU-101 has 10 bed space records', `(Found: ${icuBedsRes.data?.data?.length})`);

    const icuAvailRes = await req('/rooms/ICU-101/beds/available', { headers: patientHeaders });
    assert(icuAvailRes.status === 200, 'Patient can query available beds endpoint');
    const initialIcuAvail = icuAvailRes.data?.data;
    assert(Array.isArray(initialIcuAvail), 'Available beds returned as array');

    // 404 on non-existent room
    const notFoundRes = await req('/rooms/NON-EXISTENT/beds', { headers: adminHeaders });
    assert(notFoundRes.status === 404, 'Returns HTTP 404 for non-existent room');

    // 4. Clean up any leftover occupied beds for test patient
    console.log('\n--- Step 4: Patient Bed Request Creation & Duplicate Prevention ---');
    const allIcuBeds = await req('/rooms/ICU-101/beds', { headers: adminHeaders });
    for (const b of allIcuBeds.data?.data || []) {
      if (b.status === 'OCCUPIED') {
        await req(`/beds/${b._id}/release`, { method: 'PATCH', headers: adminHeaders });
      }
    }
    const allWdBeds = await req('/rooms/WD-201/beds', { headers: adminHeaders });
    for (const b of allWdBeds.data?.data || []) {
      if (b.status === 'OCCUPIED') {
        await req(`/beds/${b._id}/release`, { method: 'PATCH', headers: adminHeaders });
      }
    }

    // Patient requests bed in ICU
    const reqRes = await req('/bed-requests', {
      method: 'POST',
      headers: patientHeaders,
      body: { sectionId: 'ICU-101' },
    });
    assert(reqRes.status === 201, 'Patient successfully submits bed request for section ICU-101');
    assert(reqRes.data?.data?.status === 'pending', 'Newly submitted request has status "pending"');
    assert(reqRes.data?.data?.sectionName === 'ICU', 'Backend server derives sectionName ("ICU")');
    assert(reqRes.data?.data?.requesterName.length > 0, 'Backend server derives requesterName');
    const createdRequestId = reqRes.data?.data?._id;

    // Duplicate request check
    const dupRes = await req('/bed-requests', {
      method: 'POST',
      headers: patientHeaders,
      body: { sectionId: 'WD-201' },
    });
    assert(dupRes.status === 409, 'Duplicate pending request returns HTTP 409', `("${dupRes.data?.message}")`);

    // Doctor/Nurse/Admin blocked from patient-only request endpoint
    const docReqRes = await req('/bed-requests', {
      method: 'POST',
      headers: doctorHeaders,
      body: { sectionId: 'ICU-101' },
    });
    assert(docReqRes.status === 403, 'Non-patient blocked from creating bed request (HTTP 403)');

    // Patient views own requests
    const myReqsRes = await req('/bed-requests/my', { headers: patientHeaders });
    assert(
      myReqsRes.data?.data?.some(r => r._id === createdRequestId),
      'Patient views own bed request in /api/bed-requests/my'
    );

    // 5. Admin Approves Request (Happy Path)
    console.log('\n--- Step 5: Admin Approves Bed Request ---');
    const availBedsAfterReq = await req('/rooms/ICU-101/beds/available', { headers: adminHeaders });
    const targetBed = availBedsAfterReq.data?.data?.[0];
    assert(targetBed, 'Available bed found for approval', `(${targetBed.bedNumber})`);

    const approveRes = await req(`/bed-requests/${createdRequestId}/approve`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { bedId: targetBed._id },
    });
    assert(approveRes.status === 200, 'Admin successfully approves bed request');
    assert(approveRes.data?.data?.request?.status === 'approved', 'Bed request marked as "approved"');
    assert(approveRes.data?.data?.request?.assignedBedNumber === targetBed.bedNumber, 'Assigned bed number recorded on request');
    assert(approveRes.data?.data?.bed?.status === 'OCCUPIED', 'Target bed status updated to "OCCUPIED"');

    // 6. One Occupied Bed Per Patient Rule
    console.log('\n--- Step 6: Single Occupied Bed Per Patient Rule ---');
    const availBedsNow = await req('/rooms/ICU-101/beds/available', { headers: adminHeaders });
    const secondBed = availBedsNow.data?.data?.[0];

    const secondAllocRes = await req('/beds/allocate', {
      method: 'POST',
      headers: adminHeaders,
      body: { bedId: secondBed._id, patientId: patientUser._id || patientUser.id },
    });
    assert(
      secondAllocRes.status === 409,
      'Direct allocation blocked when patient already has an occupied bed (HTTP 409)',
      `("${secondAllocRes.data?.message}")`
    );

    // 7. Admin Releases Bed
    console.log('\n--- Step 7: Admin Releases Bed Space ---');
    const releaseRes = await req(`/beds/${targetBed._id}/release`, {
      method: 'PATCH',
      headers: adminHeaders,
    });
    assert(releaseRes.status === 200, 'Admin successfully releases bed space');
    assert(releaseRes.data?.data?.status === 'AVAILABLE', 'Bed status returns to "AVAILABLE"');
    assert(releaseRes.data?.data?.patientId === null, 'Patient reference cleared from released bed');

    // 8. Direct Allocation by Admin
    console.log('\n--- Step 8: Direct Admin Bed Space Allocation ---');
    const directAllocRes = await req('/beds/allocate', {
      method: 'POST',
      headers: adminHeaders,
      body: { bedId: targetBed._id, patientId: patientUser._id || patientUser.id },
    });
    assert(directAllocRes.status === 200, 'Admin directly allocates bed space to registered patient');
    assert(directAllocRes.data?.data?.status === 'OCCUPIED', 'Bed is now OCCUPIED');

    // Release it again for concurrency test
    await req(`/beds/${targetBed._id}/release`, { method: 'PATCH', headers: adminHeaders });

    // 9. Concurrency & Race Condition Safeguards
    console.log('\n--- Step 9: Concurrency & Double-Approval Race Condition Test ---');
    const newReqRes = await req('/bed-requests', {
      method: 'POST',
      headers: patientHeaders,
      body: { sectionId: 'WD-201' },
    });
    const pendingReqId = newReqRes.data?.data?._id;
    assert(pendingReqId, 'Created fresh pending request for concurrency test');

    const wardAvailBeds = await req('/rooms/WD-201/beds/available', { headers: adminHeaders });
    const testBedA = wardAvailBeds.data?.data?.[0];
    const testBedB = wardAvailBeds.data?.data?.[1];

    console.log('  -> Dispatching 2 concurrent approval requests on the same BedRequest...');
    const [result1, result2] = await Promise.all([
      req(`/bed-requests/${pendingReqId}/approve`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: { bedId: testBedA._id },
      }),
      req(`/bed-requests/${pendingReqId}/approve`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: { bedId: testBedB._id },
      }),
    ]);

    const statuses = [result1.status, result2.status];
    assert(statuses.includes(200), 'At least one concurrent approval received HTTP 200');
    assert(statuses.includes(409), 'The conflicting concurrent approval received HTTP 409');

    const successfulRes = result1.status === 200 ? result1 : result2;
    const failedRes = result1.status === 409 ? result1 : result2;
    assert(
      failedRes.data?.message === 'Bed request is no longer pending.' ||
      failedRes.data?.message === 'This patient already has an occupied bed.',
      'Rejected concurrent request returns proper 409 message',
      `("${failedRes.data?.message}")`
    );

    // Clean up allocated ward bed
    const successfulBed = successfulRes.data?.data?.bed;
    if (successfulBed) {
      await req(`/beds/${successfulBed._id}/release`, { method: 'PATCH', headers: adminHeaders });
    }

    // 10. Admin Rejects Request
    console.log('\n--- Step 10: Admin Bed Request Rejection ---');
    const rejectReqRes = await req('/bed-requests', {
      method: 'POST',
      headers: patientHeaders,
      body: { sectionId: 'EMR-101' },
    });
    const toRejectId = rejectReqRes.data?.data?._id;

    const rejectActionRes = await req(`/bed-requests/${toRejectId}/reject`, {
      method: 'PATCH',
      headers: adminHeaders,
    });
    assert(rejectActionRes.status === 200, 'Admin rejects bed request successfully');
    assert(rejectActionRes.data?.data?.status === 'rejected', 'Bed request marked as "rejected"');

    // 11. RBAC Guard Verification
    console.log('\n--- Step 11: Comprehensive Role-Based Access Control (RBAC) ---');
    // Doctor cannot allocate bed
    const docAlloc = await req('/beds/allocate', {
      method: 'POST',
      headers: doctorHeaders,
      body: { bedId: targetBed._id, patientId: patientUser._id },
    });
    assert(docAlloc.status === 403, 'Doctor blocked from /api/beds/allocate (HTTP 403)');

    // Patient cannot release bed
    const patientRel = await req(`/beds/${targetBed._id}/release`, {
      method: 'PATCH',
      headers: patientHeaders,
    });
    assert(patientRel.status === 403, 'Patient blocked from /api/beds/:id/release (HTTP 403)');

    // Doctor cannot approve bed request
    const docApprove = await req(`/bed-requests/${toRejectId}/approve`, {
      method: 'PATCH',
      headers: doctorHeaders,
      body: { bedId: targetBed._id },
    });
    assert(docApprove.status === 403, 'Doctor blocked from /api/bed-requests/:id/approve (HTTP 403)');

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
