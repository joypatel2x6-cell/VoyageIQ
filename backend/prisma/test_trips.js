const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testTripModule() {
  console.log('🧪 Starting Trip Management API Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const testEmail1 = `trip.user1.${Date.now()}@example.com`;
  const testEmail2 = `trip.user2.${Date.now()}@example.com`;

  let token1 = null;
  let user1 = null;
  let token2 = null;
  let user2 = null;
  let createdTripId = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register two test users
    // ----------------------------------------------------
    console.log('\n--- SETUP: Registering test users ---');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Charlie',
        lastName: 'Planner',
        email: testEmail1,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const reg1Data = await reg1Res.json();
    token1 = reg1Data.token;
    user1 = reg1Data.user;

    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Diana',
        lastName: 'Viewer',
        email: testEmail2,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const reg2Data = await reg2Res.json();
    token2 = reg2Data.token;
    user2 = reg2Data.user;

    console.log(`User 1 ID: ${user1.id}, User 2 ID: ${user2.id}`);

    // ----------------------------------------------------
    // TEST 1: POST /api/v1/trips (Create Trip)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing POST /api/v1/trips (Create Trip) ---');
    const createPayload = {
      name: 'Swiss Alps Expedition 2027',
      description: 'Mountain hiking and scenic trains in Switzerland.',
      startDate: '2027-07-10T00:00:00.000Z',
      endDate: '2027-07-20T00:00:00.000Z',
      budget: 4500.00,
      currency: 'USD',
      travelers: 2,
      travelStyle: 'Adventure & Nature',
      coverImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99',
    };

    const createRes = await fetch(`${baseUrl}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify(createPayload),
    });
    const createData = await createRes.json();
    console.log(`Create Status: ${createRes.status}`);
    console.log('Create Body:', JSON.stringify(createData, null, 2));

    if (createRes.status !== 201 || !createData.trip || createData.trip.status !== 'UPCOMING') {
      throw new Error('Create trip failed or status miscalculated!');
    }
    createdTripId = createData.trip.id;
    console.log('✅ Create Trip & Automatic Status UPCOMING PASSED');

    // ----------------------------------------------------
    // TEST 2: Validation - End date before start date
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Date Validation (endDate < startDate) ---');
    const invalidDateRes = await fetch(`${baseUrl}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        ...createPayload,
        startDate: '2027-07-20T00:00:00.000Z',
        endDate: '2027-07-10T00:00:00.000Z',
      }),
    });
    console.log(`Invalid Date Status: ${invalidDateRes.status}`);
    if (invalidDateRes.status !== 400) {
      throw new Error('Invalid date check failed!');
    }
    console.log('✅ Date validation PASSED');

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/trips (My Trips with filters)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing GET /api/v1/trips (List My Trips) ---');
    const listRes = await fetch(`${baseUrl}/trips?status=UPCOMING&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const listData = await listRes.json();
    console.log(`List Status: ${listRes.status}`);
    console.log('List Count:', listData.data.trips.length);
    console.log('Pagination:', listData.data.pagination);

    if (listRes.status !== 200 || listData.data.trips.length !== 1) {
      throw new Error('GET /trips listing failed!');
    }
    console.log('✅ GET /trips PASSED');

    // ----------------------------------------------------
    // SETUP STOPS & EXPENSES FOR DETAIL TEST
    // ----------------------------------------------------
    const city = await prisma.city.findFirst();
    const stop = await prisma.tripStop.create({
      data: {
        tripId: createdTripId,
        cityId: city.id,
        startDate: new Date('2027-07-11T00:00:00.000Z'),
        endDate: new Date('2027-07-15T00:00:00.000Z'),
        orderIndex: 1,
        notes: 'Hotel in Interlaken',
      },
    });

    await prisma.expense.create({
      data: {
        tripId: createdTripId,
        category: 'ACCOMMODATION',
        amount: 1200.00,
        currency: 'USD',
        description: 'Chalet Resort Stay',
        date: new Date('2027-07-11T00:00:00.000Z'),
      },
    });

    await prisma.expense.create({
      data: {
        tripId: createdTripId,
        category: 'TRANSPORT',
        amount: 350.00,
        currency: 'USD',
        description: 'Swiss Travel Pass',
        date: new Date('2027-07-10T00:00:00.000Z'),
      },
    });

    // ----------------------------------------------------
    // TEST 4: GET /api/v1/trips/:tripId (Detail & Budget Summary)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing GET /api/v1/trips/:tripId (Trip Detail) ---');
    const detailRes = await fetch(`${baseUrl}/trips/${createdTripId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const detailData = await detailRes.json();
    console.log(`Detail Status: ${detailRes.status}`);
    console.log('Budget Summary:', JSON.stringify(detailData.budgetSummary, null, 2));

    if (detailRes.status !== 200 || detailData.budgetSummary.totalExpenses !== 1550) {
      throw new Error('Trip detail or budget summary calculation failed!');
    }
    if (detailData.owner.email || detailData.owner.passwordHash) {
      throw new Error('SECURITY VIOLATION: Private user info exposed in trip owner summary!');
    }
    console.log('✅ GET /trips/:tripId & Budget Summary PASSED');

    // ----------------------------------------------------
    // TEST 5: PATCH /api/v1/trips/:tripId (Update)
    // ----------------------------------------------------
    console.log('\n--- 5. Testing PATCH /api/v1/trips/:tripId (Update) ---');
    const updateRes = await fetch(`${baseUrl}/trips/${createdTripId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        name: 'Swiss Alps Hiking & Cultural Odyssey 2027',
        budget: 5000.00,
      }),
    });
    const updateData = await updateRes.json();
    console.log(`Update Status: ${updateRes.status}`);
    if (updateRes.status !== 200 || updateData.trip.name !== 'Swiss Alps Hiking & Cultural Odyssey 2027') {
      throw new Error('PATCH /trips/:tripId update failed!');
    }
    console.log('✅ PATCH /trips/:tripId PASSED');

    // ----------------------------------------------------
    // TEST 6: POST /api/v1/trips/:tripId/duplicate (Duplicate Trip)
    // ----------------------------------------------------
    console.log('\n--- 6. Testing POST /api/v1/trips/:tripId/duplicate ---');
    const dupRes = await fetch(`${baseUrl}/trips/${createdTripId}/duplicate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const dupData = await dupRes.json();
    console.log(`Duplicate Status: ${dupRes.status}`);
    console.log('Duplicated Trip Name:', dupData.trip?.name);

    if (dupRes.status !== 201 || !dupData.trip || dupData.trip.name !== 'Swiss Alps Hiking & Cultural Odyssey 2027 (Copy)') {
      throw new Error('Duplicate trip failed!');
    }

    const duplicatedTripId = dupData.trip.id;

    // Verify duplicated trip stops and expenses exist
    const dupDetail = await prisma.trip.findUnique({
      where: { id: duplicatedTripId },
      include: { tripStops: true, expenses: true },
    });
    if (dupDetail.tripStops.length !== 1 || dupDetail.expenses.length !== 2) {
      throw new Error('Duplication transaction failed to copy stops/expenses!');
    }
    console.log('✅ Duplicate Trip & Transaction PASSED');

    // ----------------------------------------------------
    // TEST 7: DELETE Authorization (Non-owner attempt - 403)
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Unauthorized Delete (403 Forbidden) ---');
    const unauthDelRes = await fetch(`${baseUrl}/trips/${createdTripId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    console.log(`Unauthorized Delete Status: ${unauthDelRes.status}`);
    if (unauthDelRes.status !== 403) {
      throw new Error('Unauthorized delete was not blocked with 403!');
    }
    console.log('✅ Unauthorized delete protection PASSED');

    // ----------------------------------------------------
    // TEST 8: DELETE /api/v1/trips/:tripId (Owner Delete)
    // ----------------------------------------------------
    console.log('\n--- 8. Testing Owner Delete Trip ---');
    const del1Res = await fetch(`${baseUrl}/trips/${createdTripId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    console.log(`Delete Original Status: ${del1Res.status}`);

    const del2Res = await fetch(`${baseUrl}/trips/${duplicatedTripId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    console.log(`Delete Duplicate Status: ${del2Res.status}`);

    if (del1Res.status !== 200 || del2Res.status !== 200) {
      throw new Error('Owner delete trip failed!');
    }
    console.log('✅ Delete Trip PASSED');

    // Cleanup users
    await prisma.user.deleteMany({
      where: { id: { in: [user1.id, user2.id] } },
    });
    console.log('\n🧹 Test users cleaned up.');

    console.log('\n🎉 ALL TRIP MANAGEMENT API TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Trip Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testTripModule();
