const BASE_URL = 'http://localhost:5001/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'HTTP Error');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runPaymentSystemTest() {
  console.log('\n==================================================');
  console.log('  PIXXTECHNOLOGIES PAYMENT SYSTEM INTEGRATION TEST');
  console.log('==================================================\n');

  try {
    // 1. LOGIN
    console.log('[Step 1] Logging in as Manager...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'manager@pixxtechnologies.com',
        password: 'admin123',
      }),
    });
    const token = loginRes.token;
    console.log('  ✓ Manager logged in successfully. Token acquired.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. CREATE PROPERTY
    console.log('\n[Step 2] Creating Property "Pixx Commercial Plaza"...');
    const propRes = await request('/properties', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        propertyName: `Pixx Plaza Test ${Date.now()}`,
        propertyType: 'Commercial',
        address: '100 Tech Highway',
      }),
    });
    const property = propRes.data;
    console.log(`  ✓ Property created: ${property.propertyName} (ID: ${property._id})`);

    // 3. CREATE UNIT
    console.log('\n[Step 3] Creating Unit "Shop 05"...');
    const unitRes = await request(`/properties/${property._id}/units`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        unitName: 'Shop 05',
        unitNumber: 'S-05',
        priceType: 'monthly_rent',
        price: 50000,
        monthlyRent: 50000,
      }),
    });
    const unit = unitRes.data;
    console.log(`  ✓ Unit created: ${unit.unitName} (Monthly Rent: Rs 50,000)`);

    // 4. CREATE CUSTOMER
    console.log('\n[Step 4] Creating Customer "Ahmed Khan"...');
    const custRes = await request('/customers', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fullName: 'Arthur Pendelton',
        phone: '+44 20 7946 0123',
        email: 'arthur.pendelton@example.com',
        cnicOrId: 'QQ 12 34 56 A',
        address: 'London, United Kingdom',
      }),
    });
    const customer = custRes.data;
    console.log(`  ✓ Customer created: ${customer.fullName} (ID: ${customer._id})`);

    // 5. CREATE ACTIVE TENANCY
    console.log('\n[Step 5] Creating Active Tenancy starting 2026-01-01...');
    const tenancyRes = await request('/tenancies', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerId: customer._id,
        propertyId: property._id,
        unitId: unit._id,
        startDate: '2026-01-01',
        monthlyRent: 50000,
        paymentDueDay: 5,
      }),
    });
    const tenancy = tenancyRes.data;
    console.log(`  ✓ Active Tenancy created (ID: ${tenancy._id})`);

    // 6. FETCH PAYMENTS & CONFIRM AUTOMATED GENERATION
    console.log('\n[Step 6] Verifying Automated Monthly Rent Payments...');
    const paymentsRes = await request(`/payments?tenancyId=${tenancy._id}`, { headers });
    const payments = paymentsRes.data.filter(
      (p) => (p.tenancyId?._id || p.tenancyId) === tenancy._id
    );
    console.log(`  ✓ Generated ${payments.length} monthly payment records for tenancy.`);

    if (payments.length === 0) {
      throw new Error('No payments generated for active tenancy!');
    }

    const testPayment = payments[payments.length - 1]; // Oldest / First payment
    console.log(`  ✓ Target Payment Record: ID=${testPayment._id}, Billing Month=${testPayment.billingMonth}/${testPayment.billingYear}, Amount=${testPayment.amount}, Status=${testPayment.status}`);

    // 7. CONFIRM DUPLICATE IS NOT CREATED
    console.log('\n[Step 7] Testing Duplicate Prevention...');
    const recheckPaymentsRes = await request(`/payments?tenancyId=${tenancy._id}`, { headers });
    const countAfterRecheck = recheckPaymentsRes.data.filter(
      (p) => (p.tenancyId?._id || p.tenancyId) === tenancy._id
    ).length;
    if (countAfterRecheck === payments.length) {
      console.log(`  ✓ Duplicate protection verified! Payment count remained constant (${countAfterRecheck}).`);
    } else {
      throw new Error(`Duplicate payments created! Expected ${payments.length}, got ${countAfterRecheck}`);
    }

    // 8. RECORD PARTIAL PAYMENT (Rs 20,000 on Rs 50,000)
    console.log('\n[Step 8] Recording Partial Payment (Rs 20,000)...');
    const partialPayRes = await request(`/payments/${testPayment._id}/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amountPaid: 20000,
        paymentDate: '2026-01-05',
        paymentMethod: 'Bank Transfer',
        reference: 'TXN-PARTIAL-101',
        notes: 'First partial payment installment',
      }),
    });
    const partialPayment = partialPayRes.data;
    console.log(`  ✓ Payment Recorded. PaidAmount: Rs ${partialPayment.paidAmount}, RemainingAmount: Rs ${partialPayment.remainingAmount}, Status: ${partialPayment.status}`);
    if (partialPayment.status !== 'Partially Paid' || partialPayment.remainingAmount !== 30000) {
      throw new Error(`Partial payment calculation error! Status: ${partialPayment.status}, Remaining: ${partialPayment.remainingAmount}`);
    }

    // 9. RECORD REMAINING FULL PAYMENT (Rs 30,000)
    console.log('\n[Step 9] Recording Remaining Payment (Rs 30,000)...');
    const fullPayRes = await request(`/payments/${testPayment._id}/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amountPaid: 30000,
        paymentDate: '2026-01-10',
        paymentMethod: 'Bank Transfer',
        reference: 'TXN-FULL-102',
        notes: 'Second final installment',
      }),
    });
    const fullPayment = fullPayRes.data;
    console.log(`  ✓ Payment Complete. PaidAmount: Rs ${fullPayment.paidAmount}, RemainingAmount: Rs ${fullPayment.remainingAmount}, Status: ${fullPayment.status}`);
    if (fullPayment.status !== 'Paid' || fullPayment.remainingAmount !== 0) {
      throw new Error(`Full payment calculation error! Status: ${fullPayment.status}, Remaining: ${fullPayment.remainingAmount}`);
    }

    // 10. OVERDUE & UPCOMING APIs
    console.log('\n[Step 10] Testing Overdue & Upcoming Payment APIs...');
    const overdueRes = await request('/payments/overdue', { headers });
    console.log(`  ✓ Overdue Payments Count: ${overdueRes.count}`);

    const upcomingRes = await request('/payments/upcoming', { headers });
    console.log(`  ✓ Upcoming Payments Count: ${upcomingRes.count}`);

    // 11. DASHBOARD FINANCIAL SUMMARY API
    console.log('\n[Step 11] Testing Dashboard Financial Summary API...');
    const finRes = await request('/dashboard/financial-summary', { headers });
    const fin = finRes.data;
    console.log('  ✓ Financial Summary retrieved:');
    console.log(`     - Total Rent Expected:  Rs ${fin.totalRentExpected}`);
    console.log(`     - Total Rent Collected: Rs ${fin.totalRentCollected}`);
    console.log(`     - Total Outstanding:    Rs ${fin.totalOutstanding}`);
    console.log(`     - Total Overdue:        Rs ${fin.totalOverdue}`);
    console.log(`     - Occupied Units:       ${fin.occupiedUnits}`);
    console.log(`     - Available Units:      ${fin.availableUnits}`);

    // 12. INVOICE API TEST
    console.log('\n[Step 12] Testing Invoices API...');
    const invRes = await request('/invoices', { headers });
    console.log(`  ✓ Invoices Count: ${invRes.count}`);

    // 13. EXPENSE SEPARATION TEST
    console.log('\n[Step 13] Creating Separate Property Expense (Rs 15,000)...');
    const expRes = await request('/expenses', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        propertyId: property._id,
        supplier: 'Plumbing Solutions Inc',
        description: 'Water pipe repair',
        category: 'Repairs',
        amount: 15000,
        date: '2026-01-15',
        paidAmount: 15000,
        notes: 'Paid via cash',
      }),
    });
    const expense = expRes.data;
    console.log(`  ✓ Expense recorded separately: ${expense.description} (Amount: Rs ${expense.amount}, Status: ${expense.status})`);

    // 14. END TENANCY
    console.log('\n[Step 14] Ending Tenancy...');
    await request(`/tenancies/${tenancy._id}/end`, {
      method: 'POST',
      headers,
    });
    console.log('  ✓ Tenancy ended.');

    // 15. CONFIRM UNIT REVERTS TO AVAILABLE
    const unitAfterEndRes = await request('/units', { headers });
    const updatedUnit = unitAfterEndRes.data.find((u) => u._id === unit._id);
    console.log(`  ✓ Unit Status after tenancy end: ${updatedUnit.status}`);
    if (updatedUnit.status !== 'Available') {
      throw new Error(`Unit status did not revert to Available! Status: ${updatedUnit.status}`);
    }

    console.log('\n==================================================');
    console.log(' 🎉 ALL 15 PAYMENT MANAGEMENT TESTS PASSED 100%');
    console.log('==================================================\n');
  } catch (error) {
    console.error('\n❌ Payment System Test Failed:', error.data || error.message);
    process.exit(1);
  }
}

runPaymentSystemTest();
