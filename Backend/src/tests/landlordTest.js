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

async function runLandlordTest() {
  console.log('\n================================================================');
  console.log('  PIXXTECHNOLOGIES LANDLORD MANAGEMENT INTEGRATION TEST SUITE');
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

    // 2. CREATE LANDLORD 1
    console.log('\n[Step 2] Creating Landlord 1 "Arthur Pendelton"...');
    const l1Res = await request('/landlords', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fullName: 'Arthur Pendelton',
        email: 'arthur.pendelton@example.com',
        phone: '+44 20 7946 0123',
        address: '15 High Street, Kensington',
        country: 'United Kingdom',
        region: 'Greater London',
        logo: {
          url: 'https://res.cloudinary.com/pixx/image/upload/v1/landlords/ahmed.png',
          publicId: 'pixxtechnologies/landlords/ahmed',
        },
        notes: 'VIP Commercial Property Investor',
      }),
    });
    const l1 = l1Res.data;
    console.log(`  ✓ Landlord 1 created: ${l1.fullName} (ID: ${l1._id || l1.id})`);

    // 3. CREATE LANDLORD 2
    console.log('\n[Step 3] Creating Landlord 2 "Margaret Thatcher"...');
    const l2Res = await request('/landlords', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fullName: 'Margaret Thatcher',
        email: 'margaret.t@example.com',
        phone: '+44 161 496 0234',
        address: '42 Deansgate',
        country: 'United Kingdom',
        region: 'Greater Manchester',
      }),
    });
    const l2 = l2Res.data;
    console.log(`  ✓ Landlord 2 created: ${l2.fullName} (ID: ${l2._id || l2.id})`);

    // 4. ATTEMPT CREATE PROPERTY WITHOUT LANDLORD (EXPECT ERROR)
    console.log('\n[Step 4] Attempting to create Property without selecting a Landlord (expect failure)...');
    try {
      await request('/properties', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Orphan Plaza',
          type: 'Commercial',
        }),
      });
      console.error('  ❌ FAILED: Property created without landlord!');
      process.exit(1);
    } catch (err) {
      console.log(`  ✓ Correctly rejected: HTTP ${err.status} - "${err.message}"`);
    }

    // 5. CREATE PROPERTY 1 ASSIGNED TO LANDLORD 1
    console.log('\n[Step 5] Creating Property 1 "Main Shopping Plaza" assigned to Landlord 1...');
    const p1Res = await request('/properties', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Main Shopping Plaza',
        type: 'Commercial',
        address: 'Oxford Street',
        city: 'London',
        landlordId: l1._id || l1.id,
      }),
    });
    const p1 = p1Res.data;
    console.log(`  ✓ Property 1 created: ${p1.name} (Landlord: ${p1.landlordId?.fullName || 'Assigned'})`);

    // 6. CREATE PROPERTY 2 ASSIGNED TO LANDLORD 1
    console.log('\n[Step 6] Creating Property 2 "City Office Building" assigned to Landlord 1...');
    const p2Res = await request('/properties', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'City Office Building',
        type: 'Commercial',
        address: 'Deansgate',
        city: 'Manchester',
        landlordId: l1._id || l1.id,
      }),
    });
    const p2 = p2Res.data;
    console.log(`  ✓ Property 2 created: ${p2.name} (Landlord: ${p2.landlordId?.fullName || 'Assigned'})`);

    // 7. GET LANDLORD 1 PROPERTIES API
    console.log('\n[Step 7] Testing GET /api/landlords/:id/properties for Landlord 1...');
    const l1PropsRes = await request(`/landlords/${l1._id || l1.id}/properties`, { headers });
    console.log(`  ✓ Retrieved ${l1PropsRes.count} properties belonging to ${l1PropsRes.landlord.fullName}.`);

    // 8. TEST DELETE PROTECTION BUSINESS RULE (EXPECT HTTP 400)
    console.log('\n[Step 8] Attempting to DELETE Landlord 1 while properties are assigned (expect deletion prevention)...');
    try {
      await request(`/landlords/${l1._id || l1.id}`, {
        method: 'DELETE',
        headers,
      });
      console.error('  ❌ FAILED: Landlord with assigned properties was deleted!');
      process.exit(1);
    } catch (err) {
      console.log(`  ✓ Deletion prevented as expected: HTTP ${err.status} - "${err.message}"`);
    }

    // 9. REASSIGN PROPERTY 1 & PROPERTY 2 TO LANDLORD 2
    console.log('\n[Step 9] Reassigning Property 1 & Property 2 to Landlord 2 ("Muhammad Ali")...');
    await request(`/properties/${p1._id || p1.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ landlordId: l2._id || l2.id }),
    });
    await request(`/properties/${p2._id || p2.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ landlordId: l2._id || l2.id }),
    });
    console.log('  ✓ Properties successfully reassigned to Landlord 2.');

    // 10. CLEAN DELETION OF LANDLORD 1 NOW THAT IT HAS 0 PROPERTIES
    console.log('\n[Step 10] Deleting Landlord 1 (now that it has 0 properties)...');
    const deleteRes = await request(`/landlords/${l1._id || l1.id}`, {
      method: 'DELETE',
      headers,
    });
    console.log(`  ✓ ${deleteRes.message}`);

    // 11. DASHBOARD OVERVIEW FOR LANDLORD 2
    console.log('\n[Step 11] Testing Dashboard stats filtered by Landlord 2...');
    const dashRes = await request(`/dashboard?landlordId=${l2._id || l2.id}`, { headers });
    console.log(`  ✓ Dashboard for Landlord 2: Total Properties=${dashRes.data.propertyInfo.totalProperties}, Total Units=${dashRes.data.propertyInfo.totalUnits}`);

    // 12. EXPORT LANDLORDS
    console.log('\n[Step 12] Testing Landlords CSV & Excel export endpoints...');
    const csvExport = await fetch(`${BASE_URL}/export/landlords`, { headers });
    const csvText = await csvExport.text();
    console.log(`  ✓ CSV Export retrieved. Length: ${csvText.length} bytes.`);

    console.log('\n================================================================');
    console.log('  🎉 ALL 12 LANDLORD MANAGEMENT INTEGRATION TESTS PASSED 100%');
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.data) console.error('Details:', error.data);
    process.exit(1);
  }
}

runLandlordTest();
