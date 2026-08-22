const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testCalendarModule() {
  console.log('🧪 Starting VoyageIQ Calendar and Timeline Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const ownerEmail = `calendar.owner.${Date.now()}@example.com`;
  let ownerToken = null;
  let ownerUser = null;
  let tripId = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register user, create trip (Nov 01 - Nov 04)
    // ----------------------------------------------------
    console.log('\n--- SETUP: Creating user, trip, stop, activity, and expense ---');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Timeline',
        lastName: 'Traveler',
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
        name: 'Paris November Gateway 2027',
        startDate: '2027-11-01T00:00:00.000Z',
        endDate: '2027-11-04T00:00:00.000Z',
        budget: 1500,
        currency: 'EUR',
      }),
    });
    const tripData = await tripRes.json();
    tripId = tripData.trip.id;

    // Add Stop in Paris
    const paris = await prisma.city.findFirst({ where: { name: 'Paris' } });
    if (!paris) throw new Error('Paris city not found in DB!');

    const stopRes = await fetch(`${baseUrl}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        cityId: paris.id,
        startDate: '2027-11-01T00:00:00.000Z',
        endDate: '2027-11-03T00:00:00.000Z',
        notes: 'Hotel near Louvre',
      }),
    });
    const stopData = await stopRes.json();

    // Schedule Louvre Activity ($25) on Nov 02
    const louvre = await prisma.activity.findFirst({ where: { cityId: paris.id } });
    if (louvre) {
      await fetch(`${baseUrl}/trips/${tripId}/stops/${stopData.stop.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          activityId: louvre.id,
          date: '2027-11-02T00:00:00.000Z',
          startTime: '10:00',
          duration: 180,
          cost: 25.00,
        }),
      });
    }

    // Add Manual Expense on Nov 02 ($40 Food)
    await fetch(`${baseUrl}/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        category: 'FOOD',
        amount: 40,
        currency: 'EUR',
        description: 'Bistro Dinner in Latin Quarter',
        date: '2027-11-02T00:00:00.000Z',
      }),
    });

    // ----------------------------------------------------
    // TEST 1: GET /api/v1/trips/:tripId/calendar
    // ----------------------------------------------------
    console.log('\n--- 1. Testing GET /api/v1/trips/:tripId/calendar ---');
    const calRes = await fetch(`${baseUrl}/trips/${tripId}/calendar`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const calData = await calRes.json();
    console.log(`Calendar Status: ${calRes.status}`);
    console.log(`Duration: ${calData.data.durationInDays} days`);
    console.log('Calendar Days:', calData.data.calendarDays.map(d => `${d.date} (City: ${d.city?.name || 'None'}, Total: €${d.dailyTotalCost})`));

    if (calRes.status !== 200 || calData.data.calendarDays.length !== 4) {
      throw new Error('GET trip calendar failed!');
    }
    const nov02 = calData.data.calendarDays.find(d => d.date === '2027-11-02');
    if (!nov02 || nov02.dailyTotalCost !== 65 || nov02.activities.length !== 1 || nov02.expenses.length !== 1) {
      throw new Error('Calendar day 2 aggregation incorrect! Expected total €65');
    }
    console.log('✅ GET trip calendar PASSED');

    // ----------------------------------------------------
    // TEST 2: GET /api/v1/trips/:tripId/timeline
    // ----------------------------------------------------
    console.log('\n--- 2. Testing GET /api/v1/trips/:tripId/timeline ---');
    const timelineRes = await fetch(`${baseUrl}/trips/${tripId}/timeline`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const timelineData = await timelineRes.json();
    console.log(`Timeline Status: ${timelineRes.status}`);
    console.log('Timeline Entries Count:', timelineData.data.timeline.length);

    if (timelineRes.status !== 200 || timelineData.data.timeline.length !== 4) {
      throw new Error('GET trip timeline failed!');
    }
    console.log('✅ GET trip timeline PASSED');

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/trips/:tripId/days/2027-11-02
    // ----------------------------------------------------
    console.log('\n--- 3. Testing GET /api/v1/trips/:tripId/days/2027-11-02 ---');
    const dayRes = await fetch(`${baseUrl}/trips/${tripId}/days/2027-11-02`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dayData = await dayRes.json();
    console.log(`Single Day Status: ${dayRes.status}`);
    console.log('Single Day Body:', JSON.stringify(dayData.data, null, 2));

    if (dayRes.status !== 200 || dayData.data.date !== '2027-11-02' || dayData.data.dailyTotalCost !== 65) {
      throw new Error('GET single day detail failed!');
    }
    console.log('✅ GET single day detail PASSED');

    // ----------------------------------------------------
    // TEST 4: Date Bounds Check (Invalid Date - 400 Bad Request)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Date Bounds Validation (2027-11-10) ---');
    const invalidDayRes = await fetch(`${baseUrl}/trips/${tripId}/days/2027-11-10`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`Invalid Date Status: ${invalidDayRes.status}`);
    if (invalidDayRes.status !== 400) {
      throw new Error('Out-of-bounds date check failed!');
    }
    console.log('✅ Date bounds validation PASSED');

    // Cleanup
    await prisma.trip.delete({ where: { id: tripId } });
    await prisma.user.delete({ where: { id: ownerUser.id } });
    console.log('\n🧹 Test trip and user cleaned up.');

    console.log('\n🎉 ALL CALENDAR & TIMELINE API TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Calendar & Timeline Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testCalendarModule();
