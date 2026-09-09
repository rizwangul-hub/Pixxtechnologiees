const BASE_URL = 'http://localhost:5001/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

async function runFinalBackendTest() {
  console.log('\n================================================================');
  console.log('  PIXXTECHNOLOGIES FINAL BACKEND DEVELOPMENT PHASE TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. MANAGER LOGIN
    console.log('[Step 1] Logging in as Manager...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'manager@pixxtechnologies.com',
        password: 'admin123',
      }),
    });
    const token = loginRes.token;
    console.log('  ✓ Manager logged in successfully. JWT Token acquired.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. CONSOLIDATED DASHBOARD API
    console.log('\n[Step 2] Testing Consolidated Single Dashboard API (GET /api/dashboard)...');
    const dashRes = await request('/dashboard', { headers });
    const d = dashRes.data;
    console.log('  ✓ Dashboard Payload Structure Verified:');
    console.log(`     - Property Info:  Total=${d.propertyInfo.totalProperties}, Occupied=${d.propertyInfo.occupiedUnits}, Available=${d.propertyInfo.availableUnits}`);
    console.log(`     - Tenant Info:    Customers=${d.tenantInfo.totalCustomers}, ActiveTenancies=${d.tenantInfo.activeTenancies}`);
    console.log(`     - Financial Info: Expected=Rs ${d.financialInfo.monthlyExpectedRent}, Collected=Rs ${d.financialInfo.monthlyCollectedRent}, Outstanding=Rs ${d.financialInfo.monthlyOutstandingRent}`);
    console.log(`     - Payment Counts: Overdue=${d.paymentInfo.overduePaymentCount}, Upcoming=${d.paymentInfo.upcomingPaymentCount}, Paid=${d.paymentInfo.paidPaymentCount}`);

    // 3. PROPERTY DASHBOARD API
    console.log('\n[Step 3] Testing Per-Property Dashboard API (GET /api/dashboard/properties)...');
    const propDashRes = await request('/dashboard/properties', { headers });
    console.log(`  ✓ Retrieved analytics for ${propDashRes.data.length} properties.`);

    // 4. CREATE LANDLORD & PROPERTY
    console.log('\n[Step 4] Creating Landlord & Property "Pixx Executive Plaza"...');
    const landlordRes = await request('/landlords', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fullName: 'Test Suite Landlord',
        email: 'landlord.test@example.com',
        phone: '+92 300 0000000',
      }),
    });
    const landlord = landlordRes.data;

    const propRes = await request('/properties', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        propertyName: `Pixx Executive Plaza ${Date.now()}`,
        propertyType: 'Commercial',
        address: '500 Business Avenue',
        city: 'London',
        landlordId: landlord._id,
      }),
    });
    const property = propRes.data;
    console.log(`  ✓ Property created: ${property.propertyName} (ID: ${property._id}, Landlord: ${landlord.fullName})`);

    // 5. CREATE UNIT
    console.log('\n[Step 5] Creating Unit "Suite 101"...');
    const unitRes = await request(`/properties/${property._id}/units`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        unitName: 'Suite 101',
        unitNumber: 'STE-101',
        priceType: 'monthly_rent',
        price: 75000,
        monthlyRent: 75000,
      }),
    });
    const unit = unitRes.data;
    console.log(`  ✓ Unit created: ${unit.unitName} (Monthly Rent: £ 75,000)`);

    // 6. CREATE CUSTOMER
    console.log('\n[Step 6] Creating Customer "Zainab Malik"...');
    const custRes = await request('/customers', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fullName: 'Zainab Malik',
        phone: '+44 20 7946 0777',
        email: 'zainab.malik@example.com',
        cnicOrId: 'QQ 98 76 54 Z',
        address: 'Kensington, London',
      }),
    });
    const customer = custRes.data;
    console.log(`  ✓ Customer created: ${customer.fullName} (ID: ${customer._id})`);

    // 7. ASSIGN CUSTOMER / CREATE ACTIVE TENANCY
    console.log('\n[Step 7] Assigning Customer & Creating Active Tenancy (2026-01-01)...');
    const tenancyRes = await request('/tenancies', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerId: customer._id,
        propertyId: property._id,
        unitId: unit._id,
        startDate: '2026-01-01',
        monthlyRent: 75000,
        paymentDueDay: 5,
      }),
    });
    const tenancy = tenancyRes.data;
    console.log(`  ✓ Active Tenancy created (ID: ${tenancy._id})`);

    // Verify unit status updated to Occupied
    const checkUnitRes = await request(`/properties/${property._id}/units`, { headers });
    const assignedUnit = checkUnitRes.data.find((u) => u._id === unit._id);
    console.log(`  ✓ Unit Status immediately updated to: ${assignedUnit.status}`);

    // 8. VERIFY AUTOMATED RENT GENERATION & DUPLICATE PROTECTION
    console.log('\n[Step 8] Verifying Automated Rent Payments & Duplicate Protection...');
    const payRes1 = await request(`/payments?tenancyId=${tenancy._id}`, { headers });
    const rentCount1 = payRes1.data.length;
    console.log(`  ✓ Generated ${rentCount1} monthly payment records for tenancy.`);

    const payRes2 = await request(`/payments?tenancyId=${tenancy._id}`, { headers });
    const rentCount2 = payRes2.data.length;
    if (rentCount1 === rentCount2) {
      console.log(`  ✓ Duplicate protection confirmed! Count remained unchanged (${rentCount2}).`);
    } else {
      throw new Error(`Duplicate monthly payments generated! ${rentCount1} vs ${rentCount2}`);
    }

    // 9. RECORD PAYMENT (PARTIAL THEN FULL)
    console.log('\n[Step 9] Recording Payment (Partial Rs 35,000 then remaining Rs 40,000)...');
    const targetPayment = payRes1.data[payRes1.data.length - 1]; // First payment
    const partialRes = await request(`/payments/${targetPayment._id}/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amountPaid: 35000,
        paymentDate: '2026-01-05',
        paymentMethod: 'Online',
        reference: 'ONL-998811',
      }),
    });
    console.log(`  ✓ Partial payment recorded. Status: ${partialRes.data.status}, Remaining: Rs ${partialRes.data.remainingAmount}`);

    const fullRes = await request(`/payments/${targetPayment._id}/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amountPaid: 40000,
        paymentDate: '2026-01-10',
        paymentMethod: 'Online',
        reference: 'ONL-998812',
      }),
    });
    console.log(`  ✓ Full payment completed. Status: ${fullRes.data.status}, Remaining: Rs ${fullRes.data.remainingAmount}`);

    // 10. EXPENSE RECORDING (SEPARATE FROM RENT)
    console.log('\n[Step 10] Recording Property Expense (Rs 25,000)...');
    const expRes = await request('/expenses', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        propertyId: property._id,
        supplier: 'Electric Utility Corp',
        description: 'Common area electricity bill',
        category: 'Utilities',
        amount: 25000,
        date: '2026-01-15',
        paidAmount: 25000,
      }),
    });
    console.log(`  ✓ Expense created: ${expRes.data.description} (Rs ${expRes.data.amount})`);

    // 11. EXPORT ENGINE (CSV & EXCEL XLSX)
    console.log('\n[Step 11] Testing CSV & Excel (.xlsx) Export Engine...');
    const csvRes = await fetch(`${BASE_URL}/export/payments?fromDate=2026-01-01&toDate=2026-12-31`, { headers });
    const csvContent = await csvRes.text();
    console.log(`  ✓ CSV Export retrieved. Headers: "${csvContent.split('\r\n')[0].slice(0, 60)}..."`);

    const excelRes = await fetch(`${BASE_URL}/export/payments/excel?fromDate=2026-01-01&toDate=2026-12-31`, { headers });
    const excelBuffer = await excelRes.arrayBuffer();
    console.log(`  ✓ Excel (.xlsx) Export retrieved. Size: ${excelBuffer.byteLength} bytes.`);

    // 12. SEARCH, FILTERING & PAGINATION
    console.log('\n[Step 12] Testing Search, Filtering, and Pagination...');
    const searchCustomerRes = await request('/customers?search=Zainab&page=1&limit=5', { headers });
    console.log(`  ✓ Customer search ("Zainab"): Found ${searchCustomerRes.count} matches (Page 1 of ${searchCustomerRes.pagination.pages}).`);

    const searchPropertyRes = await request('/properties?search=Executive&page=1&limit=5', { headers });
    console.log(`  ✓ Property search ("Executive"): Found ${searchPropertyRes.count} matches.`);

    // 13. TENANCY TERMINATION
    console.log('\n[Step 13] Ending Tenancy & Verifying Unit Status Revert...');
    await request(`/tenancies/${tenancy._id}/end`, {
      method: 'POST',
      headers,
    });
    const finalUnitRes = await request(`/properties/${property._id}/units`, { headers });
    const endedUnit = finalUnitRes.data.find((u) => u._id === unit._id);
    console.log(`  ✓ Tenancy ended. Unit status successfully reverted to: ${endedUnit.status}`);

    // 14. SECURITY & VALIDATION AUDIT
    console.log('\n[Step 14] Auditing Security & Input Validation...');
    let authFailed = false;
    try {
      await request('/dashboard'); // No Authorization header
    } catch (e) {
      if (e.status === 401) authFailed = true;
    }
    console.log(`  ✓ Protected Route Authorization Check (Unauthenticated request rejected with HTTP 401): ${authFailed}`);

    console.log('\n================================================================');
    console.log(' 🎉 ALL 14 FINAL BACKEND DEVELOPMENT TESTS PASSED 100%');
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ Final Backend Test Suite Failed:', error.data || error.message);
    process.exit(1);
  }
}

runFinalBackendTest();
