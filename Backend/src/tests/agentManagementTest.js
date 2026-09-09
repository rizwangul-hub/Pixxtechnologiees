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
let landlordId = '';
let propertyId = '';
let unitId = '';
let agentId = '';
let tenantId = '';
let tenancyId = '';
let expenseId = '';

async function runAgentManagementTests() {
  console.log('================================================================');
  console.log('  PIXXTECHNOLOGIES AGENT MANAGEMENT SYSTEM INTEGRATION TEST');
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

    // [Step 2] Create Landlord, Property & Unit
    console.log('[Step 2] Creating Landlord, Property ("ABC Plaza"), and Unit ("Shop 12")...');
    const landlordRes = await request('/landlords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        fullName: 'Test Landlord AgentSuite',
        phone: '+92 300 1112233',
        email: 'landlord_agent_suite@example.com',
      }),
    });
    landlordId = landlordRes.data._id || landlordRes.data.id;

    const propRes = await request('/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        name: 'ABC Plaza',
        type: 'Commercial',
        address: 'Main Commercial Area',
        city: 'Peshawar',
        landlordId,
      }),
    });
    propertyId = propRes.data._id || propRes.data.id;

    const unitRes = await request('/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        propertyId,
        name: 'Shop 12',
        type: 'Shop',
        price: 60000,
        monthlyRent: 60000,
        status: 'Available',
      }),
    });
    unitId = unitRes.data._id || unitRes.data.id;
    console.log(`  ✓ Created Property "ABC Plaza" (${propertyId}) and Unit "Shop 12" (${unitId}).\n`);

    // [Step 3] Create Agent ("Ali Khan")
    console.log('[Step 3] Creating Agent "Ali Khan" (Region: KPK)...');
    const agentRes = await request('/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        fullName: 'Ali Khan',
        phone: '+44 161 496 0555',
        email: 'ali.khan@example.com',
        address: 'Manchester',
        country: 'United Kingdom',
        region: 'Greater Manchester',
        notes: 'Commercial Agent for ABC Plaza',
      }),
    });
    agentId = agentRes.data._id || agentRes.data.id;
    console.log(`  ✓ Agent created successfully: ID=${agentId}, Name=${agentRes.data.fullName}\n`);

    // [Step 4] Create Tenant ("Arthur Pendelton")
    console.log('[Step 4] Creating Tenant "Arthur Pendelton"...');
    const tenantRes = await request('/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        name: 'Arthur Pendelton',
        phone: '+44 20 7946 0123',
        email: 'arthur.pendelton@example.com',
        type: 'Individual',
      }),
    });
    tenantId = tenantRes.data._id || tenantRes.data.id;
    console.log(`  ✓ Tenant created: ID=${tenantId}\n`);

    // [Step 5] Assign Tenant & Agent with Company Monthly Amount (£ 50,000)
    console.log('[Step 5] Creating Active Tenancy (Unit: Shop 12, Tenant: Arthur Pendelton, Agent: Ali Khan, Company Monthly Amount: £ 50,000)...');
    const todayStr = new Date().toISOString().split('T')[0];
    const tenancyRes = await request('/tenancies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        customerId: tenantId,
        propertyId,
        unitId,
        agentId,
        monthlyRent: 60000, // Tenant Actual Rent
        companyMonthlyAmount: 50000, // Amount Agent Must Give Company
        agentPaymentDueDay: 1,
        startDate: todayStr,
      }),
    });
    tenancyId = tenancyRes.data._id || tenancyRes.data.id;
    console.log(`  ✓ Active Tenancy created: ID=${tenancyId}\n`);

    // [Step 6] Verify Monthly Agent Settlement Generation
    console.log('[Step 6] Testing GET /api/agent-payments to verify monthly settlement generation...');
    const paymentsRes = await request(`/agent-payments?agentId=${agentId}`, {
      headers: authHeaders,
    });
    console.log(`  ✓ Retrieved ${paymentsRes.count} Agent Settlement record(s).`);
    const initialPayment = paymentsRes.data[0];
    console.log(`  ✓ Expected Amount: £ ${initialPayment.expectedAmount}`);
    console.log(`  ✓ Expense Amount:  £ ${initialPayment.expenseAmount}`);
    console.log(`  ✓ Net Amount:      £ ${initialPayment.netAmount}`);
    console.log(`  ✓ Remaining:       £ ${initialPayment.remainingAmount}\n`);

    if (initialPayment.expectedAmount !== 50000 || initialPayment.netAmount !== 50000) {
      throw new Error(`Expected net amount 50000 but got ${initialPayment.netAmount}`);
    }

    // [Step 7] Create Agent Expense ("Plumbing Repair" = £ 5,000)
    console.log('[Step 7] Creating Approved Agent Expense ("Plumbing Repair" = £ 5,000)...');
    const expenseRes = await request('/agent-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        agentId,
        tenancyId,
        propertyId,
        unitId,
        tenantId,
        expenseCategory: 'Plumbing repair',
        description: 'Fixed broken water pipe in Shop 12',
        amount: 5000,
        date: todayStr,
        status: 'Approved',
      }),
    });
    expenseId = expenseRes.data._id || expenseRes.data.id;
    console.log(`  ✓ Agent Expense created: ID=${expenseId}, Amount=Rs ${expenseRes.data.amount}\n`);

    // [Step 8] Verify Auto-Deduction on Agent Settlement
    console.log('[Step 8] Verifying Net Amount recalculation (Company Amount Rs 50,000 - Expense Rs 5,000 = Net Rs 45,000)...');
    const updatedPaymentRes = await request(`/agent-payments/${initialPayment._id}`, {
      headers: authHeaders,
    });
    const updatedPayment = updatedPaymentRes.data;
    console.log(`  ✓ Recalculated Expense Amount: Rs ${updatedPayment.expenseAmount}`);
    console.log(`  ✓ Recalculated Net Amount:     Rs ${updatedPayment.netAmount}`);
    console.log(`  ✓ Recalculated Remaining:      Rs ${updatedPayment.remainingAmount}`);

    if (updatedPayment.netAmount !== 45000 || updatedPayment.remainingAmount !== 45000) {
      throw new Error(`Net amount should be 45000 but got ${updatedPayment.netAmount}`);
    }
    console.log('  ✓ Auto-Deduction Formula (Net = Company Amount - Agent Expense) verified 100%!\n');

    // [Step 9] Record Full Payment Received from Agent (Rs 45,000)
    console.log('[Step 9] Recording Payment Received from Agent (Rs 45,000)...');
    const payRes = await request(`/agent-payments/${initialPayment._id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        amountPaid: 45000,
        paymentMethod: 'Bank Transfer',
        reference: 'TRX-AGENT-9911',
        notes: 'Full monthly settlement received from Ali Khan',
      }),
    });
    console.log(`  ✓ Settlement Status: ${payRes.data.status}`);
    console.log(`  ✓ Total Paid:        Rs ${payRes.data.paidAmount}`);
    console.log(`  ✓ Remaining:         Rs ${payRes.data.remainingAmount}`);

    if (payRes.data.status !== 'Paid' || payRes.data.remainingAmount !== 0) {
      throw new Error(`Payment status should be Paid with 0 remaining, got status ${payRes.data.status}`);
    }
    console.log('  ✓ Full Payment Settlement verified 100%!\n');

    // [Step 10] Test Agent Deletion Guard (Assigned Agent cannot be deleted)
    console.log('[Step 10] Testing Agent Deletion Guard (Attempting to delete active Agent "Ali Khan")...');
    try {
      await request(`/agents/${agentId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      throw new Error('Agent deletion should have been blocked!');
    } catch (guardErr) {
      if (guardErr.status === 400) {
        console.log(`  ✓ Deletion Guard correctly blocked deletion! Response message: "${guardErr.message}"\n`);
      } else {
        throw guardErr;
      }
    }

    // [Step 11] Test Dashboard Agent Financial Summary API (GET /api/dashboard/agent-summary)
    console.log('[Step 11] Testing GET /api/dashboard/agent-summary...');
    const summaryRes = await request('/dashboard/agent-summary', {
      headers: authHeaders,
    });
    const summaryData = summaryRes.data;
    console.log('  ✓ Agent Dashboard Financial Summary Metrics:');
    console.log(`     - Active Agents:     ${summaryData.activeAgents}`);
    console.log(`     - Assigned Units:    ${summaryData.assignedUnits}`);
    console.log(`     - Total Expected:    Rs ${summaryData.totalExpected}`);
    console.log(`     - Total Expenses:    Rs ${summaryData.totalExpenses}`);
    console.log(`     - Net Amount:        Rs ${summaryData.netAmount}`);
    console.log(`     - Total Received:    Rs ${summaryData.totalReceived}`);
    console.log(`     - Total Outstanding: Rs ${summaryData.totalOutstanding}\n`);

    if (summaryData.activeAgents < 1 || summaryData.assignedUnits < 1) {
      throw new Error('Dashboard summary metrics mismatch');
    }

    // [Step 12] Cleanup Test Records
    console.log('[Step 12] Cleaning up test records...');
    await request(`/tenancies/${tenancyId}`, { method: 'DELETE', headers: authHeaders }).catch(() => {});
    await request(`/agents/${agentId}`, { method: 'DELETE', headers: authHeaders }).catch(() => {});
    await request(`/customers/${tenantId}`, { method: 'DELETE', headers: authHeaders }).catch(() => {});
    await request(`/units/${unitId}`, { method: 'DELETE', headers: authHeaders }).catch(() => {});
    await request(`/properties/${propertyId}`, { method: 'DELETE', headers: authHeaders }).catch(() => {});
    await request(`/landlords/${landlordId}`, { method: 'DELETE', headers: authHeaders }).catch(() => {});
    console.log('  ✓ Test cleanup completed.\n');

    console.log('================================================================');
    console.log('  🎉 ALL 12 AGENT MANAGEMENT SYSTEM TESTS PASSED 100%');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (err.data) console.error('Error Details:', JSON.stringify(err.data, null, 2));
    process.exit(1);
  }
}

runAgentManagementTests();
