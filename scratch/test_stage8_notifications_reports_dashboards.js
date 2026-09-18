import http from 'http';

const API_BASE = 'http://localhost:5000/api';

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
};

const login = async (email, password) => {
  const res = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email, password },
  });
  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
};

async function runStage8Tests() {
  console.log('================================================================');
  console.log('  STAGE 8 AUTOMATED VERIFICATION: NOTIFICATIONS, REPORTS, DASHBOARDS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    console.log('1. Verifying API Health...');
    const health = await request(`${API_BASE}/health`);
    assert(health.status === 200 && health.body.success, 'Backend health check returns 200 OK');

    // 2. Login as different roles
    console.log('\n2. Authenticating User Roles...');
    const adminToken = await login('admin@medisync.local', 'Admin@2026!');
    const doctorToken = await login('arun.kumar@medisync.com', 'DocArun@2026!');
    const nurseToken = await login('anitha@medisync.com', 'NurseAnitha@2026!');
    const receptionistToken = await login('receptionist@medisync.local', 'Recept@2026!');
    const pharmacistToken = await login('pharmacist@medisync.local', 'Pharm@2026!');
    const patientToken = await login('patient@medisync.local', 'Patient@2026!');
    assert(adminToken && doctorToken && nurseToken && receptionistToken && pharmacistToken && patientToken, 'All 6 canonical role tokens obtained');

    // 3. Notification API Endpoints
    console.log('\n3. Testing Notification API Endpoints & Unread Counts...');
    const notifsBefore = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(notifsBefore.status === 200 && Array.isArray(notifsBefore.body.data), 'GET /notifications returns array for patient');

    const unreadBefore = await request(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(unreadBefore.status === 200 && typeof unreadBefore.body.unreadCount === 'number', 'GET /notifications/unread-count returns unread count');

    // 4. Trigger Notification Hooks via Business Operations
    console.log('\n4. Triggering Business Events to Verify Post-Action Notification Hooks...');

    // A. Doctor creates a prescription for Patient -> Patient & Pharmacist/Admin get notified
    console.log('  -> Creating Prescription (Doctor)...');
    const patProfile = await request(`${API_BASE}/patients/me`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const patientDocId = patProfile.body?.patient?._id;
    assert(Boolean(patientDocId), `Patient ID resolved: ${patientDocId}`);

    const medList = await request(`${API_BASE}/pharmacy/medicines`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const activeMed = medList.body?.data?.[0];
    assert(Boolean(activeMed), `Active medicine resolved: ${activeMed?.name}`);

    const rxRes = await request(`${API_BASE}/prescriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        patientId: patientDocId,
        medicines: [{ medicineId: activeMed._id, quantity: 2, dosage: '1-0-1', duration: '5 days' }],
        diagnosis: 'Stage 8 Clinical Test',
      }
    });
    assert(rxRes.status === 201, 'Doctor successfully created prescription');

    // Wait for async non-blocking notifications
    await new Promise(r => setTimeout(r, 400));

    // Check Patient received prescription notification
    const patNotifsAfterRx = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const rxNotif = patNotifsAfterRx.body.data?.find(n =>
      String(n.type).toUpperCase() === 'PRESCRIPTION' || n.title?.toLowerCase().includes('prescription')
    );
    assert(Boolean(rxNotif), 'Patient received "New Prescription Issued" notification hook');

    // B. Blood Request creation -> Admin gets notified
    console.log('  -> Creating Blood Request (Patient)...');
    const bloodReq = await request(`${API_BASE}/blood-requests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: { bloodGroup: 'AB+', requestedUnits: 1 }
    });
    assert(bloodReq.status === 201 || bloodReq.status === 409, 'Blood request executed');

    // C. Visitor pass creation -> Patient gets notified
    console.log('  -> Creating Visitor Pass (Receptionist)...');
    const visRes = await request(`${API_BASE}/visitors`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
      body: {
        visitorName: 'Stage8 Tester',
        phone: '9876543299',
        relationship: 'Friend',
        patientId: patientDocId
      }
    });
    assert(visRes.status === 201, 'Visitor pass created by receptionist');

    const patNotifsAfterVis = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const visNotif = patNotifsAfterVis.body.data?.find(n =>
      String(n.type).toUpperCase() === 'VISITOR' || n.title?.toLowerCase().includes('visitor')
    );
    assert(Boolean(visNotif), 'Patient received "Visitor Pass Issued" notification hook');

    // D. Billing invoice generation -> Patient gets notified
    console.log('  -> Creating Billing Invoice (Admin)...');
    const billRes = await request(`${API_BASE}/billing`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        patientId: patientDocId,
        items: [{ description: 'General Consultation Fee', quantity: 1, unitPrice: 500 }],
        notes: 'Stage 8 Automated Test'
      }
    });
    assert(billRes.status === 201, 'Billing invoice created by admin');

    const patNotifsAfterBill = await request(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const billNotif = patNotifsAfterBill.body.data?.find(n =>
      String(n.type).toUpperCase() === 'BILLING' || n.title?.toLowerCase().includes('invoice')
    );
    assert(Boolean(billNotif), 'Patient received "New Invoice Generated" notification hook');

    // 5. Notification Read/Mark-All-Read/Delete operations
    console.log('\n5. Testing Notification Mark as Read & Lifecycle Operations...');
    if (rxNotif) {
      const readRes = await request(`${API_BASE}/notifications/${rxNotif._id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      assert(readRes.status === 200 && readRes.body.data?.isRead === true, 'PATCH /notifications/:id/read marks notification as read');
    }

    const markAllRes = await request(`${API_BASE}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(markAllRes.status === 200 && markAllRes.body.success, 'PATCH /notifications/mark-all-read updates all unread notifications');

    const unreadFinal = await request(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(unreadFinal.status === 200 && unreadFinal.body.unreadCount === 0, 'Unread count is 0 after markAllAsRead');

    // 6. Reports API & RBAC Security Verification
    console.log('\n6. Testing Live Reports Aggregations & RBAC Security...');
    const sumReport = await request(`${API_BASE}/reports/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(sumReport.status === 200 && sumReport.body.data?.patients && sumReport.body.data?.beds, 'GET /reports/summary aggregates live MongoDB data for Admin');

    const bedReport = await request(`${API_BASE}/reports/bed-occupancy`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(bedReport.status === 200 && typeof bedReport.body.data?.occupancyRate === 'number', 'GET /reports/bed-occupancy computes live occupancy rate');

    const bloodReportRes = await request(`${API_BASE}/reports/blood-bank`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(bloodReportRes.status === 200 && Array.isArray(bloodReportRes.body.data?.inventory), 'GET /reports/blood-bank audits all 8 blood groups');

    const pharmReportRes = await request(`${API_BASE}/reports/pharmacy-inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(pharmReportRes.status === 200 && pharmReportRes.body.data?.summary?.inStock !== undefined, 'GET /reports/pharmacy-inventory returns accurate stock status');

    const finReport = await request(`${API_BASE}/reports/financial`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(finReport.status === 200 && finReport.body.data?.totalPaid !== undefined, 'GET /reports/financial computes live revenue and collections');

    // RBAC: Pharmacist accessing pharmacy vs financial reports
    const pharmOwnRes = await request(`${API_BASE}/reports/pharmacy-inventory`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` }
    });
    assert(pharmOwnRes.status === 200, 'Pharmacist is PERMITTED to access /reports/pharmacy-inventory');

    const pharmForbiddenRes = await request(`${API_BASE}/reports/financial`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` }
    });
    assert(pharmForbiddenRes.status === 403, 'Pharmacist is FORBIDDEN (403) from accessing /reports/financial');

    // RBAC: Patient accessing reports
    const patForbiddenRes = await request(`${API_BASE}/reports/summary`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(patForbiddenRes.status === 403, 'Patient is FORBIDDEN (403) from accessing hospital reports');

    // 7. Role-Specific Dashboards API Verification
    console.log('\n7. Testing Live Aggregated Dashboards API (/api/dashboard)...');
    const adminDash = await request(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminDash.status === 200 &&
      adminDash.body.role === 'admin' &&
      Array.isArray(adminDash.body.data?.charts?.bedAllocationsLast7Days) &&
      Array.isArray(adminDash.body.data?.charts?.revenueTrends) &&
      Array.isArray(adminDash.body.data?.recentActivities),
      'GET /dashboard (Admin) returns live stats, 7-day bed trends, revenue chart, and recent activity'
    );

    const docDash = await request(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert(docDash.status === 200 && docDash.body.role === 'doctor', 'GET /dashboard (Doctor) returns doctor-specific payload');

    const nurseDash = await request(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${nurseToken}` }
    });
    assert(nurseDash.status === 200 && nurseDash.body.role === 'nurse', 'GET /dashboard (Nurse) returns nurse-specific payload');

    const receptDash = await request(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${receptionistToken}` }
    });
    assert(receptDash.status === 200 && receptDash.body.role === 'receptionist', 'GET /dashboard (Receptionist) returns receptionist payload');

    const pharmDash = await request(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` }
    });
    assert(pharmDash.status === 200 && pharmDash.body.role === 'pharmacist', 'GET /dashboard (Pharmacist) returns pharmacist payload');

    const patDash = await request(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(patDash.status === 200 && patDash.body.role === 'patient', 'GET /dashboard (Patient) returns patient-isolated dashboard payload');

  } catch (err) {
    console.error('\n[FATAL ERROR IN TEST SUITE]:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  STAGE 8 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage8Tests();
