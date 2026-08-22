const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testSharingModule() {
  console.log('🧪 Starting Public Trip Sharing Backend API Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const timestamp = Date.now();
  const emailOwner = `owner.sharing.${timestamp}@example.com`;
  const emailCopier = `copier.sharing.${timestamp}@example.com`;

  let ownerToken = null;
  let ownerUser = null;
  let copierToken = null;
  let copierUser = null;

  let createdTripId = null;
  let activeShareToken = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register two test users (Owner & Copier)
    // ----------------------------------------------------
    console.log('\n--- SETUP: Registering Owner and Copier users ---');
    const ownerRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Alice',
        lastName: 'Owner',
        email: emailOwner,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const ownerRegData = await ownerRegRes.json();
    ownerToken = ownerRegData.token;
    ownerUser = ownerRegData.user;

    const copierRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Bob',
        lastName: 'Copier',
        email: emailCopier,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const copierRegData = await copierRegRes.json();
    copierToken = copierRegData.token;
    copierUser = copierRegData.user;

    console.log(`Owner User ID: ${ownerUser.id}, Copier User ID: ${copierUser.id}`);

    // Create a trip for Owner
    const createTripRes = await fetch(`${baseUrl}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: 'Japanese Cultural Discovery 2027',
        description: 'Exploring Tokyo and Kyoto temples, shrines, and cuisine.',
        startDate: '2027-10-01T00:00:00.000Z',
        endDate: '2027-10-10T00:00:00.000Z',
        budget: 6000.00,
        currency: 'USD',
        travelers: 2,
        travelStyle: 'Cultural & Culinary',
        coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
      }),
    });
    const createTripData = await createTripRes.json();
    createdTripId = createTripData.trip.id;

    // Attach Stop, Activity & Expense to the trip for detailed view & copying tests
    const city = await prisma.city.findFirst();
    const activity = await prisma.activity.findFirst();

    const stop = await prisma.tripStop.create({
      data: {
        tripId: createdTripId,
        cityId: city.id,
        startDate: new Date('2027-10-02T00:00:00.000Z'),
        endDate: new Date('2027-10-06T00:00:00.000Z'),
        orderIndex: 1,
        notes: 'Hotel in Shinjuku',
      },
    });

    if (activity) {
      await prisma.tripActivity.create({
        data: {
          tripStopId: stop.id,
          activityId: activity.id,
          date: new Date('2027-10-03T00:00:00.000Z'),
          startTime: '09:00',
          duration: 180,
          cost: 50.00,
          notes: 'Morning guided tour',
          orderIndex: 1,
        },
      });
    }

    await prisma.expense.create({
      data: {
        tripId: createdTripId,
        category: 'ACCOMMODATION',
        amount: 1500.00,
        currency: 'USD',
        description: 'Shinjuku Ryokan Stay',
        date: new Date('2027-10-02T00:00:00.000Z'),
      },
    });

    // ----------------------------------------------------
    // TEST 1: POST /api/v1/trips/:tripId/share (Enable Sharing)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing POST /api/v1/trips/:tripId/share ---');
    const shareRes = await fetch(`${baseUrl}/trips/${createdTripId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const shareData = await shareRes.json();
    console.log(`Share Status: ${shareRes.status}`);
    console.log('Share Body:', JSON.stringify(shareData, null, 2));

    if (shareRes.status !== 200 || !shareData.data.shareToken || !shareData.data.isPublic) {
      throw new Error('POST /trips/:tripId/share failed or shareToken missing!');
    }
    activeShareToken = shareData.data.shareToken;

    if (activeShareToken.length < 32) {
      throw new Error('Security requirement failed: Share token is not cryptographically secure length!');
    }
    console.log('✅ Enable Trip Sharing PASSED');

    // ----------------------------------------------------
    // TEST 2: Authorization Check - Non-owner attempt to share (403)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Non-Owner Enable Share (403 Forbidden) ---');
    const unauthShareRes = await fetch(`${baseUrl}/trips/${createdTripId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${copierToken}` },
    });
    console.log(`Unauth Share Status: ${unauthShareRes.status}`);
    if (unauthShareRes.status !== 403) {
      throw new Error('Non-owner share toggle was not blocked with 403!');
    }
    console.log('✅ Non-owner protection PASSED');

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/public/trips/:shareToken (Public View Unauthenticated)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing GET /api/v1/public/trips/:shareToken ---');
    const publicRes = await fetch(`${baseUrl}/public/trips/${activeShareToken}`);
    const publicData = await publicRes.json();
    console.log(`Public View Status: ${publicRes.status}`);
    console.log('Public Data:', JSON.stringify(publicData, null, 2));

    if (publicRes.status !== 200 || !publicData.data) {
      throw new Error('GET /public/trips/:shareToken failed!');
    }

    const tripInfo = publicData.data;
    if (
      !tripInfo.name ||
      !tripInfo.description ||
      !tripInfo.duration ||
      !tripInfo.cities ||
      !tripInfo.activities ||
      !tripInfo.budget ||
      !tripInfo.budgetBreakdown
    ) {
      throw new Error('Public trip view is missing required fields (name, duration, cities, activities, budget)!');
    }

    // VERIFY SECURITY & DATA PRIVACY: Do NOT return password, private user data, or internal DB user details
    const serialized = JSON.stringify(publicData);
    if (
      serialized.includes('passwordHash') ||
      serialized.includes(emailOwner) ||
      serialized.includes(ownerUser.id) ||
      serialized.includes('firstName')
    ) {
      throw new Error('SECURITY VIOLATION: Private user info or internal DB user IDs exposed in public endpoint!');
    }
    console.log('✅ Public Trip View & Security Sanitization PASSED');

    // ----------------------------------------------------
    // TEST 4: POST /api/v1/public/trips/:shareToken/copy (Copy Trip)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing POST /api/v1/public/trips/:shareToken/copy ---');
    const copyRes = await fetch(`${baseUrl}/public/trips/${activeShareToken}/copy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${copierToken}` },
    });
    const copyData = await copyRes.json();
    console.log(`Copy Status: ${copyRes.status}`);
    console.log('Copied Trip:', JSON.stringify(copyData.trip, null, 2));

    if (copyRes.status !== 201 || !copyData.trip) {
      throw new Error('Copy public trip failed!');
    }

    const copiedTrip = copyData.trip;
    if (copiedTrip.userId !== copierUser.id) {
      throw new Error('Copied trip ownership was not set to the authenticated copying user!');
    }
    if (copiedTrip.isPublic || copiedTrip.shareToken) {
      throw new Error('Copied trip failed to reset isPublic or shareToken!');
    }

    // Verify duplicated stops and expenses exist with fresh IDs
    const copiedDetail = await prisma.trip.findUnique({
      where: { id: copiedTrip.id },
      include: { tripStops: { include: { tripActivities: true } }, expenses: true },
    });

    if (copiedDetail.tripStops.length !== 1 || copiedDetail.expenses.length !== 1) {
      throw new Error('Transaction failed to copy trip stops and expenses!');
    }
    console.log('✅ Copy Public Trip & Database Transaction PASSED');

    // ----------------------------------------------------
    // TEST 5: DELETE /api/v1/trips/:tripId/share (Disable Share)
    // ----------------------------------------------------
    console.log('\n--- 5. Testing DELETE /api/v1/trips/:tripId/share ---');
    const disableRes = await fetch(`${baseUrl}/trips/${createdTripId}/share`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const disableData = await disableRes.json();
    console.log(`Disable Status: ${disableRes.status}`);

    if (disableRes.status !== 200 || disableData.data.isPublic !== false) {
      throw new Error('Disable trip sharing failed!');
    }
    console.log('✅ Disable Trip Sharing PASSED');

    // ----------------------------------------------------
    // TEST 6: GET Public Trip After Disable (404)
    // ----------------------------------------------------
    console.log('\n--- 6. Testing GET Public Trip After Unshare (404 Not Found) ---');
    const publicDisabledRes = await fetch(`${baseUrl}/public/trips/${activeShareToken}`);
    console.log(`Public View Disabled Status: ${publicDisabledRes.status}`);
    if (publicDisabledRes.status !== 404) {
      throw new Error('Disabled public trip was still accessible!');
    }
    console.log('✅ Access to unshared trip correctly blocked with 404 PASSED');

    // Cleanup
    await prisma.trip.deleteMany({
      where: { id: { in: [createdTripId, copiedTrip.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUser.id, copierUser.id] } },
    });
    console.log('\n🧹 Test trips and users cleaned up.');

    console.log('\n🎉 ALL PUBLIC TRIP SHARING BACKEND TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Sharing Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testSharingModule();
