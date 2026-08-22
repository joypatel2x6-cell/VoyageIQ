const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testTripActivityModule() {
  console.log('🧪 Starting Trip Activities API Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const ownerEmail = `act.owner.${Date.now()}@example.com`;
  let ownerToken = null;
  let ownerUser = null;
  let tripId = null;
  let stopId = null;
  let act1Id = null;
  let act2Id = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register user, create trip, create stop
    // ----------------------------------------------------
    console.log('\n--- SETUP: Creating user, trip, and stop ---');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Elena',
        lastName: 'Itinerary',
        email: ownerEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const regData = await regRes.json();
    ownerToken = regData.token;
    ownerUser = regData.user;

    const tripRes = await fetch(`${baseUrl}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: 'Paris Art & Culinary Discovery 2027',
        startDate: '2027-09-01T00:00:00.000Z',
        endDate: '2027-09-10T00:00:00.000Z',
        budget: 3000,
      }),
    });
    const tripData = await tripRes.json();
    tripId = tripData.trip.id;

    // Get Paris city & create stop
    const paris = await prisma.city.findFirst({ where: { name: 'Paris' } });
    if (!paris) throw new Error('Paris city record not found!');

    const stopRes = await fetch(`${baseUrl}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        cityId: paris.id,
        startDate: '2027-09-02T00:00:00.000Z',
        endDate: '2027-09-06T00:00:00.000Z',
        notes: 'Central Paris Stay',
      }),
    });
    const stopData = await stopRes.json();
    stopId = stopData.stop.id;
    console.log(`Trip ID: ${tripId}, Stop ID: ${stopId}`);

    // Get Paris activities
    const parisActivities = await prisma.activity.findMany({ where: { cityId: paris.id } });
    if (parisActivities.length < 2) throw new Error('Not enough Paris activities in DB!');

    const activity1 = parisActivities[0];
    const activity2 = parisActivities[1];

    // ----------------------------------------------------
    // TEST 1: POST /api/v1/trips/:tripId/stops/:stopId/activities (Add Act 1)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Schedule Activity 1 (Louvre Morning) ---');
    const act1Res = await fetch(`${baseUrl}/trips/${tripId}/stops/${stopId}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        activityId: activity1.id,
        date: '2027-09-03T00:00:00.000Z',
        startTime: '09:30',
        duration: 180,
        cost: 25.00,
        notes: 'Pre-booked morning entry tickets',
      }),
    });
    const act1Data = await act1Res.json();
    console.log(`Schedule Act 1 Status: ${act1Res.status}`);
    console.log('Act 1 Body:', JSON.stringify(act1Data, null, 2));

    if (act1Res.status !== 201 || act1Data.tripActivity.orderIndex !== 1 || !act1Data.tripActivity.activity) {
      throw new Error('Schedule Activity 1 failed!');
    }
    act1Id = act1Data.tripActivity.id;
    console.log('✅ Schedule Activity 1 PASSED');

    // ----------------------------------------------------
    // TEST 2: Schedule Activity 2 (Eiffel Evening)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Schedule Activity 2 (Eiffel Evening) ---');
    const act2Res = await fetch(`${baseUrl}/trips/${tripId}/stops/${stopId}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        activityId: activity2.id,
        date: '2027-09-03T00:00:00.000Z',
        startTime: '18:00',
        duration: 120,
        cost: 32.00,
        notes: 'Sunset summit view',
      }),
    });
    const act2Data = await act2Res.json();
    console.log(`Schedule Act 2 Status: ${act2Res.status}`);
    if (act2Res.status !== 201 || act2Data.tripActivity.orderIndex !== 2) {
      throw new Error('Schedule Activity 2 failed!');
    }
    act2Id = act2Data.tripActivity.id;
    console.log('✅ Schedule Activity 2 PASSED');

    // ----------------------------------------------------
    // TEST 3: Scheduling Conflict Validation
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Scheduling Conflict (Overlapping 10:00-11:00 with 09:30-12:30) ---');
    const conflictRes = await fetch(`${baseUrl}/trips/${tripId}/stops/${stopId}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        activityId: activity2.id,
        date: '2027-09-03T00:00:00.000Z',
        startTime: '10:00',
        duration: 60,
      }),
    });
    console.log(`Conflict Status: ${conflictRes.status}`);
    if (conflictRes.status !== 400) {
      throw new Error('Scheduling conflict validation failed!');
    }
    console.log('✅ Scheduling conflict check PASSED');

    // ----------------------------------------------------
    // TEST 4: GET /api/v1/trips/:tripId/stops/:stopId/activities
    // ----------------------------------------------------
    console.log('\n--- 4. Testing GET Stop Activities ---');
    const getActsRes = await fetch(`${baseUrl}/trips/${tripId}/stops/${stopId}/activities`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const getActsData = await getActsRes.json();
    console.log(`Get Acts Status: ${getActsRes.status}`);
    console.log(`Fetched ${getActsData.activities.length} activities.`);

    if (getActsRes.status !== 200 || getActsData.activities.length !== 2) {
      throw new Error('GET stop activities failed!');
    }
    console.log('✅ GET stop activities PASSED');

    // ----------------------------------------------------
    // TEST 5: POST /api/v1/trips/:tripId/stops/:stopId/activities/reorder (Transaction)
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Reorder Activities (Transaction) ---');
    const reorderRes = await fetch(`${baseUrl}/trips/${tripId}/stops/${stopId}/activities/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        tripActivityIds: [act2Id, act1Id],
      }),
    });
    const reorderData = await reorderRes.json();
    console.log(`Reorder Status: ${reorderRes.status}`);
    console.log('New Activity Order:', reorderData.activities.map(a => `${a.activity.name} (orderIndex: ${a.orderIndex})`));

    if (reorderRes.status !== 200 || reorderData.activities[0].id !== act2Id) {
      throw new Error('Reorder activities failed!');
    }
    console.log('✅ Reorder activities transaction PASSED');

    // ----------------------------------------------------
    // TEST 6: DELETE /api/v1/trips/:tripId/stops/:stopId/activities/:tripActivityId
    // ----------------------------------------------------
    console.log('\n--- 6. Testing DELETE Scheduled Activity ---');
    const delRes = await fetch(`${baseUrl}/trips/${tripId}/stops/${stopId}/activities/${act2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`Delete Status: ${delRes.status}`);
    if (delRes.status !== 200) {
      throw new Error('DELETE scheduled activity failed!');
    }
    console.log('✅ DELETE scheduled activity PASSED');

    // Cleanup
    await prisma.trip.delete({ where: { id: tripId } });
    await prisma.user.delete({ where: { id: ownerUser.id } });
    console.log('\n🧹 Test trip and user cleaned up.');

    console.log('\n🎉 ALL TRIP ACTIVITIES API TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Trip Activities Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testTripActivityModule();
