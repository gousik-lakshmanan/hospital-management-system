import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

const makeRequest = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = data ? JSON.stringify(data) : '';

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
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
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
};

const login = async (email, password) => {
  const res = await makeRequest('POST', '/auth/login', { email, password });
  if (res.status !== 200 || !res.data?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
};

async function runTests() {
  console.log('================================================================');
  console.log('STARTING STAGE 6 BLOOD BANK & DONOR INCREMENT TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate tokens for all roles
    console.log('--- Step 1: Role Authentication ---');
    const adminToken = await login('admin@medisync.local', 'Admin@2026!');
    const pharmToken = await login('pharmacist@medisync.local', 'Pharm@2026!');
    const doctorToken = await login('arun.kumar@medisync.com', 'DocArun@2026!');
    const nurseToken = await login('anitha@medisync.com', 'NurseAnitha@2026!');
    const receptToken = await login('receptionist@medisync.local', 'Recept@2026!');
    const patientToken = await login('patient@medisync.local', 'Patient@2026!');
    assert(adminToken && pharmToken && doctorToken && nurseToken && receptToken && patientToken, 'All 6 user roles authenticated successfully');

    // 2. Fetch Blood Stock
    console.log('\n--- Step 2: Fetch Blood Stock Inventory ---');
    const stockRes = await makeRequest('GET', '/blood-bank/stock', null, adminToken);
    assert(stockRes.status === 200, 'Admin can fetch blood stock (200 OK)');
    assert(Array.isArray(stockRes.data?.data) && stockRes.data?.data.length === 8, 'Returns all 8 standard blood groups');

    const patientStockRes = await makeRequest('GET', '/blood-bank/stock', null, patientToken);
    assert(patientStockRes.status === 200, 'Patient can also view blood stock (200 OK)');

    // 3. Stock by Blood Group
    console.log('\n--- Step 3: Fetch Stock by Group ---');
    const oPosRes = await makeRequest('GET', '/blood-bank/stock/O%2B', null, adminToken);
    assert(oPosRes.status === 200 && oPosRes.data?.data?.bloodGroup === 'O+', 'Fetched O+ stock successfully');
    const initialOPosUnits = oPosRes.data?.data?.units;
    console.log(`  Initial O+ Units: ${initialOPosUnits}`);

    // 4. Test Donor Registration Stock Increment (+1)
    console.log('\n--- Step 4: Test Donor Registration Stock Increment (+1) ---');
    
    // Register donor with O+
    const donorData = {
      name: 'Test Donor ' + Date.now(),
      age: 28,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '9876543210',
      email: `donor${Date.now()}@example.com`,
      address: '123 Health Ave',
    };

    const regDonorRes = await makeRequest('POST', '/blood-bank/donors', donorData, adminToken);
    assert(regDonorRes.status === 201, 'Admin can register donor (201 Created)');
    assert(regDonorRes.data?.data?.name === donorData.name, 'Donor record created correctly');
    assert(regDonorRes.data?.updatedStock?.units === initialOPosUnits + 1, `Response includes updatedStock with units incremented by +1 (${initialOPosUnits} -> ${initialOPosUnits + 1})`);

    // Verify database state by fetching O+ stock again
    const oPosAfterRes = await makeRequest('GET', '/blood-bank/stock/O%2B', null, adminToken);
    assert(oPosAfterRes.data?.data?.units === initialOPosUnits + 1, `Database verified: O+ stock is now exactly ${initialOPosUnits + 1}`);

    // Test A- donor increment
    const aNegRes = await makeRequest('GET', '/blood-bank/stock/A-', null, adminToken);
    const initialANegUnits = aNegRes.data?.data?.units || 0;
    
    const aNegDonorData = {
      name: 'A Negative Donor ' + Date.now(),
      age: 32,
      gender: 'Female',
      bloodGroup: 'A-',
      phone: '9876543211',
    };
    const regANegRes = await makeRequest('POST', '/blood-bank/donors', aNegDonorData, adminToken);
    assert(regANegRes.status === 201, 'Admin can register A- donor (201 Created)');
    assert(regANegRes.data?.updatedStock?.units === initialANegUnits + 1, `A- stock incremented by +1 (${initialANegUnits} -> ${initialANegUnits + 1})`);

    // 5. RBAC Protection on Donor Registration
    console.log('\n--- Step 5: RBAC Protection on Donor Registration ---');
    const doctorRegRes = await makeRequest('POST', '/blood-bank/donors', donorData, doctorToken);
    assert(doctorRegRes.status === 403, 'Doctor blocked from registering donor (403 Forbidden)');
    const patientRegRes = await makeRequest('POST', '/blood-bank/donors', donorData, patientToken);
    assert(patientRegRes.status === 403, 'Patient blocked from registering donor (403 Forbidden)');

    // 6. View Donors RBAC
    console.log('\n--- Step 6: View Donors List RBAC ---');
    const adminDonorsRes = await makeRequest('GET', '/blood-bank/donors', null, adminToken);
    assert(adminDonorsRes.status === 200 && Array.isArray(adminDonorsRes.data?.data), 'Admin can view donors');
    const doctorDonorsRes = await makeRequest('GET', '/blood-bank/donors', null, doctorToken);
    assert(doctorDonorsRes.status === 200, 'Doctor can view donors');
    const patientDonorsRes = await makeRequest('GET', '/blood-bank/donors', null, patientToken);
    assert(patientDonorsRes.status === 403, 'Patient blocked from viewing donors (403 Forbidden)');
    const pharmDonorsRes = await makeRequest('GET', '/blood-bank/donors', null, pharmToken);
    assert(pharmDonorsRes.status === 403, 'Pharmacist blocked from viewing donors (403 Forbidden)');

    // 7. Direct Stock Update (Admin Only)
    console.log('\n--- Step 7: Direct Stock Update RBAC & Bounds ---');
    const updateRes = await makeRequest('PATCH', '/blood-bank/stock/B%2B', { units: 10 }, adminToken);
    assert(updateRes.status === 200 && updateRes.data?.data?.units === 10, 'Admin can set stock count to 10');

    const doctorUpdateRes = await makeRequest('PATCH', '/blood-bank/stock/B%2B', { units: 20 }, doctorToken);
    assert(doctorUpdateRes.status === 403, 'Doctor blocked from directly updating stock (403 Forbidden)');

    const negUpdateRes = await makeRequest('PATCH', '/blood-bank/stock/B%2B', { delta: -50 }, adminToken);
    assert(negUpdateRes.status === 409 || negUpdateRes.status === 400, 'Negative stock reduction below zero rejected');

    // 8. Blood Request Creation & Workflow
    console.log('\n--- Step 8: Blood Request Creation & Workflow ---');
    // Admin cannot create request
    const adminReqRes = await makeRequest('POST', '/blood-requests', { bloodGroup: 'B+', requestedUnits: 2 }, adminToken);
    assert(adminReqRes.status === 403, 'Admin blocked from creating blood request (403 Forbidden)');

    // Patient creates request
    const createReqRes = await makeRequest('POST', '/blood-requests', { bloodGroup: 'B+', requestedUnits: 2 }, patientToken);
    assert(createReqRes.status === 201, 'Patient created B+ blood request for 2 units');
    const reqId = createReqRes.data?.data?._id;

    // Duplicate pending check
    const dupReqRes = await makeRequest('POST', '/blood-requests', { bloodGroup: 'B+', requestedUnits: 1 }, patientToken);
    assert(dupReqRes.status === 409, 'Duplicate pending request for same blood group blocked (409 Conflict)');

    // Admin approves request
    const bPosBeforeApprove = (await makeRequest('GET', '/blood-bank/stock/B%2B', null, adminToken)).data?.data?.units;
    const approveRes = await makeRequest('PATCH', `/blood-requests/${reqId}/approve`, {}, adminToken);
    assert(approveRes.status === 200 && approveRes.data?.data?.status === 'Approved', 'Admin approved blood request');
    const bPosAfterApprove = (await makeRequest('GET', '/blood-bank/stock/B%2B', null, adminToken)).data?.data?.units;
    assert(bPosAfterApprove === bPosBeforeApprove - 2, `B+ stock atomically decremented by 2 (${bPosBeforeApprove} -> ${bPosAfterApprove})`);

    // Double approval check
    const doubleApproveRes = await makeRequest('PATCH', `/blood-requests/${reqId}/approve`, {}, adminToken);
    assert(doubleApproveRes.status === 409, 'Already approved request cannot be approved again (409 Conflict)');

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Unexpected test failure:', err);
    process.exit(1);
  }
}

runTests();
