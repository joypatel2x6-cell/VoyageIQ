const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testTripStopModule() {
  console.log('🧪 Starting Multi-City Trip Stops API Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const ownerEmail = `stop.owner.${Date.now()}@example.com`;
  const intruderEmail = `stop.intruder.${Date.now()}@example.com`;

  let ownerToken = null;
  let ownerUser = null;
  let intruderToken = null;
  let intruderUser = null;
  let tripId = null;
  let stop1Id = null;
  let stop2Id = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register test users & create trip
    // ----------------------------------------------------
    console.log('\n--- SETUP: Registering users and creating base trip ---');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Owner',
        lastName: 'User',
        email: ownerEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const reg1Data = await reg1Res.json();
    ownerToken = reg1Data.token;
    ownerUser = reg1Data.user;

    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Intruder',
        lastName: 'User',
        email: intruderEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const reg2Data = await reg2Res.json();
    intruderToken = reg2Data.token;
    intruderUser = reg2Data.user;

    const tripRes = await fetch(`${baseUrl}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: 'Grand European Explorer 2027',
        startDate: '2027-08-01T00:00:00.000Z',
        endDate: '2027-08-20T00:00:00.000Z',
        budget: 5000,
      }),
    });
    const tripData = await tripRes.json();
    tripId = tripData.trip.id;
    console.log(`Created Trip ID: ${tripId}`);

    const cities = await prisma.city.findMany({ take: 2 });
    const paris = cities[0];
    const amsterdam = cities[1];

    // ----------------------------------------------------
    // TEST 1: POST /api/v1/trips/:tripId/stops (Add Stop 1)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Add Stop 1 (Paris: Aug 01 to Aug 05) ---');
    const stop1Res = await fetch(`${baseUrl}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        cityId: paris.id,
        startDate: '2027-08-01T00:00:00.000Z',
        endDate: '2027-08-05T00:00:00.000Z',
        notes: 'Hotel in Le Marais district',
      }),
    });
    const stop1Data = await stop1Res.json();
    console.log(`Add Stop 1 Status: ${stop1Res.status}`);
    console.log('Stop 1 Body:', JSON.stringify(stop1Data, null, 2));

    if (stop1Res.status !== 201 || stop1Data.stop.orderIndex !== 1 || stop1Data.stop.city.name !== paris.name) {
      throw new Error('Add Stop 1 failed!');
    }
    stop1Id = stop1Data.stop.id;
    console.log('✅ Add Stop 1 PASSED');

    // ----------------------------------------------------
    // TEST 2: Add Stop 2 (Amsterdam: Aug 06 to Aug 10)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Add Stop 2 (Amsterdam: Aug 06 to Aug 10) ---');
    const stop2Res = await fetch(`${baseUrl}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        cityId: amsterdam.id,
        startDate: '2027-08-06T00:00:00.000Z',
        endDate: '2027-08-10T00:00:00.000Z',
        notes: 'Canal belt house stay',
      }),
    });
    const stop2Data = await stop2Res.json();
    console.log(`Add Stop 2 Status: ${stop2Res.status}`);
    if (stop2Res.status !== 201 || stop2Data.stop.orderIndex !== 2) {
      throw new Error('Add Stop 2 failed!');
    }
    stop2Id = stop2Data.stop.id;
    console.log('✅ Add Stop 2 PASSED');

    // ----------------------------------------------------
    // TEST 3: Date Validation (Outside Trip Bounds & Overlap)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Date Bounds & Overlap Validation ---');
    // 3a. Dates outside trip range
    const outBoundsRes = await fetch(`${baseUrl}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        cityId: paris.id,
        startDate: '2027-08-25T00:00:00.000Z',
        endDate: '2027-08-30T00:00:00.000Z',
      }),
    });
    console.log(`Out-of-bounds Status: ${outBoundsRes.status}`);
    if (outBoundsRes.status !== 400) {
      throw new Error('Out-of-bounds stop date check failed!');
    }

    // 3b. Overlapping dates with Stop 1
    const overlapRes = await fetch(`${baseUrl}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        cityId: amsterdam.id,
        startDate: '2027-08-03T00:00:00.000Z',
        endDate: '2027-08-07T00:00:00.000Z',
      }),
    });
    console.log(`Overlap Status: ${overlapRes.status}`);
    if (overlapRes.status !== 400) {
      throw new Error('Overlapping stop date check failed!');
    }
    console.log('✅ Date bounds & overlap validation PASSED');

    // ----------------------------------------------------
    // TEST 4: Authorization Check (Non-owner attempt - 403)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Unauthorized Stop Addition (403 Forbidden) ---');
    const unauthAddRes = await fetch(`${baseUrl}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${intruderToken}`,
      },
      body: JSON.stringify({
        cityId: paris.id,
        startDate: '2027-08-11T00:00:00.000Z',
        endDate: '2027-08-15T00:00:00.000Z',
      }),
    });
    console.log(`Unauthorized Status: ${unauthAddRes.status}`);
    if (unauthAddRes.status !== 403) {
      throw new Error('Unauthorized stop addition was not blocked with 403!');
    }
    console.log('✅ Authorization check PASSED');

    // ----------------------------------------------------
    // TEST 5: GET /api/v1/trips/:tripId/stops
    // ----------------------------------------------------
    console.log('\n--- 5. Testing GET /api/v1/trips/:tripId/stops ---');
    const getStopsRes = await fetch(`${baseUrl}/trips/${tripId}/stops`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const getStopsData = await getStopsRes.json();
    console.log(`Get Stops Status: ${getStopsRes.status}`);
    console.log(`Fetched ${getStopsData.stops.length} stops.`);
    if (getStopsRes.status !== 200 || getStopsData.stops.length !== 2) {
      throw new Error('GET trip stops failed!');
    }
    console.log('✅ GET trip stops PASSED');

    // ----------------------------------------------------
    // TEST 6: POST /api/v1/trips/:tripId/stops/reorder (Transaction)
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Stop Reordering (Transaction) ---');
    const reorderRes = await fetch(`${baseUrl}/trips/${tripId}/stops/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        stopIds: [stop2Id, stop1Id],
      }),
    });
    const reorderData = await reorderRes.json();
    console.log(`Reorder Status: ${reorderRes.status}`);
    console.log('New Order:', reorderData.stops.map(s => `${s.city.name} (orderIndex: ${s.orderIndex})`));

    if (reorderRes.status !== 200 || reorderData.stops[0].id !== stop2Id || reorderData.stops[0].orderIndex !== 1) {
      throw new Error('Reorder stops failed!');
    }
    console.log('✅ Stop reordering transaction PASSED');

    // ----------------------------------------------------
    // TEST 7: DELETE /api/v1/trips/:tripId/stops/:stopId
    // ----------------------------------------------------
    console.log('\n--- 7. Testing DELETE Trip Stop ---');
    const delStopRes = await fetch(`${baseUrl}/trips/${tripId}/stops/${stop2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`Delete Stop Status: ${delStopRes.status}`);
    if (delStopRes.status !== 200) {
      throw new Error('Delete trip stop failed!');
    }

    // Verify City record was NOT deleted from global DB
    const checkCity = await prisma.city.findUnique({ where: { id: amsterdam.id } });
    if (!checkCity) {
      throw new Error('CRITICAL BUG: Global City record was deleted when trip stop was removed!');
    }
    console.log('✅ Delete trip stop & City preservation PASSED');

    // Cleanup test data
    await prisma.trip.delete({ where: { id: tripId } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerUser.id, intruderUser.id] } } });
    console.log('\n🧹 Test trip and users cleaned up.');

    console.log('\n🎉 ALL MULTI-CITY TRIP STOPS API TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Trip Stops Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testTripStopModule();
