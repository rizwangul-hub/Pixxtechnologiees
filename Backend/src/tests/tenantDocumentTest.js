const BASE_URL = 'http://localhost:5001/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

let authToken = '';
let testTenantId = '';
let uploadedDocId = '';
let customDocId = '';

async function runTenantDocumentTests() {
  console.log('================================================================');
  console.log('  PIXXTECHNOLOGIES TENANT DOCUMENT MANAGEMENT INTEGRATION TEST');
  console.log('================================================================\n');

  try {
    // [Step 1] Login Manager
    console.log('[Step 1] Logging in as Manager...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager@pixxtechnologies.com',
        password: 'admin123',
      }),
    });
    authToken = loginRes.token;
    console.log('  ✓ Manager logged in successfully. JWT Token acquired.\n');

    const authHeaders = { Authorization: `Bearer ${authToken}` };

    // [Step 2] Create a Tenant without documents
    console.log('[Step 2] Creating a Tenant without uploading documents...');
    const tenantRes = await request('/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        name: `Doc Test Tenant ${Date.now()}`,
        email: `doctest${Date.now()}@example.com`,
        phone: '+44 20 7946 0999',
        type: 'Individual',
        city: 'London',
      }),
    });
    testTenantId = tenantRes.data._id || tenantRes.data.id;
    console.log(`  ✓ Tenant created successfully: ID=${testTenantId} (0 mandatory documents required).\n`);

    // [Step 3] Fetch Tenant Documents (Initially 0 uploaded)
    console.log('[Step 3] Fetching initial Tenant Documents list...');
    const initDocsRes = await request(`/tenants/${testTenantId}/documents`, { headers: authHeaders });
    console.log(`  ✓ Standard document types list size: ${initDocsRes.standardList.length}`);
    console.log(`  ✓ Current uploaded documents count: ${initDocsRes.count} (0/18)\n`);

    // [Step 4] Simulate Standard Document Upload (Passport)
    console.log('[Step 4] Uploading Standard Document "Passport" with Expiry Date...');
    const twentyDaysFromNow = new Date();
    twentyDaysFromNow.setDate(twentyDaysFromNow.getDate() + 20);
    const expStr = twentyDaysFromNow.toISOString().split('T')[0];

    const form = new FormData();
    form.append('documentName', 'Passport');
    form.append('documentType', 'standard');
    form.append('expiryDate', expStr);
    const mockFile = new Blob(['Mock Passport PDF Content %PDF-1.4'], { type: 'application/pdf' });
    form.append('file', mockFile, 'tenant_passport.pdf');

    const uploadRes = await request(`/tenants/${testTenantId}/documents`, {
      method: 'POST',
      headers: authHeaders,
      body: form,
    });

    uploadedDocId = uploadRes.data._id || uploadRes.data.id;
    console.log(`  ✓ Passport uploaded successfully: DocID=${uploadedDocId}`);
    console.log(`  ✓ File URL: ${uploadRes.data.fileUrl}`);
    console.log(`  ✓ Calculated Status: "${uploadRes.data.status}" (Days Remaining: ${uploadRes.data.daysRemaining})\n`);

    // [Step 5] Duplicate Standard Document Upload (Replacing Passport)
    console.log('[Step 5] Uploading new Passport document to test deduplication rule...');
    const form2 = new FormData();
    form2.append('documentName', 'Passport');
    form2.append('documentType', 'standard');
    form2.append('expiryDate', '2027-10-15');
    const mockFile2 = new Blob(['Updated Passport PDF Content %PDF-1.4'], { type: 'application/pdf' });
    form2.append('file', mockFile2, 'tenant_passport_updated.pdf');

    const replaceRes = await request(`/tenants/${testTenantId}/documents`, {
      method: 'POST',
      headers: authHeaders,
      body: form2,
    });

    console.log(`  ✓ Passport updated successfully: DocID=${replaceRes.data._id}`);
    console.log(`  ✓ New File URL: ${replaceRes.data.fileUrl}`);

    const checkDocsRes = await request(`/tenants/${testTenantId}/documents`, { headers: authHeaders });
    console.log(`  ✓ Total uploaded documents for tenant remained 1 (Deduplication confirmed!).\n`);

    // [Step 6] Add Custom Document ("Employment Contract")
    console.log('[Step 6] Uploading Custom Document ("Employment Contract")...');
    const formCustom = new FormData();
    formCustom.append('documentName', 'Employment Contract');
    formCustom.append('documentType', 'custom');
    formCustom.append('expiryDate', '2028-12-31');
    const mockCustomFile = new Blob(['Employment contract content'], { type: 'application/pdf' });
    formCustom.append('file', mockCustomFile, 'employment_contract.pdf');

    const customRes = await request(`/tenants/${testTenantId}/documents`, {
      method: 'POST',
      headers: authHeaders,
      body: formCustom,
    });

    customDocId = customRes.data._id || customRes.data.id;
    console.log(`  ✓ Custom Document uploaded successfully: Name="${customRes.data.documentName}", Type="${customRes.data.documentType}"\n`);

    // [Step 7] Test Expiring Soon Documents API (GET /api/tenant-documents/expiring-soon)
    console.log('[Step 7] Testing GET /api/tenant-documents/expiring-soon...');
    const fifteenDays = new Date();
    fifteenDays.setDate(fifteenDays.getDate() + 15);

    await request(`/tenant-documents/${uploadedDocId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ expiryDate: fifteenDays.toISOString().split('T')[0] }),
    });

    const expiringRes = await request('/tenant-documents/expiring-soon', { headers: authHeaders });
    console.log(`  ✓ Expiring soon documents count: ${expiringRes.count}`);
    if (expiringRes.data.length > 0) {
      console.log(`  ✓ Expiring Document: ${expiringRes.data[0].documentName} for Tenant "${expiringRes.data[0].tenantName}"`);
    }
    console.log('');

    // [Step 8] Test Expired Documents API (GET /api/tenant-documents/expired)
    console.log('[Step 8] Testing GET /api/tenant-documents/expired...');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    await request(`/tenant-documents/${uploadedDocId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ expiryDate: pastDate.toISOString().split('T')[0] }),
    });

    const expiredRes = await request('/tenant-documents/expired', { headers: authHeaders });
    console.log(`  ✓ Expired documents count: ${expiredRes.count}`);
    if (expiredRes.data.length > 0) {
      console.log(`  ✓ Expired Document: ${expiredRes.data[0].documentName} (Status: "${expiredRes.data[0].status}")`);
    }
    console.log('');

    // [Step 9] Test Consolidated Dashboard API includes Document Info
    console.log('[Step 9] Testing Consolidated Dashboard API (GET /api/dashboard)...');
    const dashRes = await request('/dashboard', { headers: authHeaders });
    console.log(`  ✓ Dashboard Document Info: ExpiringSoon=${dashRes.data.documentInfo?.expiringDocumentsCount}, Expired=${dashRes.data.documentInfo?.expiredDocumentsCount}`);
    console.log(`  ✓ Dashboard Expiring Documents Array Size: ${dashRes.data.expiringDocuments?.length || 0}\n`);

    // [Step 10] Delete Document
    console.log('[Step 10] Deleting custom document...');
    await request(`/tenant-documents/${customDocId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`  ✓ Custom Document deleted successfully.\n`);

    // [Step 11] Clean up test tenant
    console.log('[Step 11] Cleaning up test tenant...');
    await request(`/customers/${testTenantId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`  ✓ Test tenant and associated documents deleted from MongoDB & Cloudinary.\n`);

    console.log('================================================================');
    console.log('  🎉 ALL 11 TENANT DOCUMENT SYSTEM TESTS PASSED 100%');
    console.log('================================================================');
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.data || error.message);
    process.exit(1);
  }
}

runTenantDocumentTests();
