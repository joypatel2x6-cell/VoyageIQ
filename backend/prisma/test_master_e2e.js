const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function runMasterE2ETests() {
  console.log('===============================================================');
  console.log('🚀 Starting VoyageIQ Master End-to-End System Integration Test');
  console.log('===============================================================');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const timestamp = Date.now();
  const emailUser1 = `master.user1.${timestamp}@example.com`;
  const emailUser2 = `master.user2.${timestamp}@example.com`;
  const emailAdmin = `master.admin.${timestamp}@example.com`;

  let token1 = null, user1 = null;
  let token2 = null, user2 = null;
  let tokenAdmin = null, userAdmin = null;

  let trip1 = null;
  let stop1 = null;
  let cityParis = null, cityRome = null;
  let actEiffel = null;
  let tripActivity1 = null;
  let expense1 = null;
  let shareToken1 = null;
  let postId1 = null;
  let notifId1 = null;

  try {
    // ------------------------------------------------------------------
    // MODULE 1: AUTHENTICATION & USER MANAGEMENT
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 1: Authentication & Users ---');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Alice',
        lastName: 'Traveler',
        email: emailUser1,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        city: 'New York',
        country: 'USA',
      }),
    });
    const reg1Data = await reg1Res.json();
    token1 = reg1Data.token;
    user1 = reg1Data.user;
    if (reg1Res.status !== 201 || !token1 || JSON.stringify(reg1Data).includes('passwordHash')) {
      throw new Error('Module 1: Registration failed or exposed passwordHash!');
    }
    console.log('  ✅ User 1 Registration PASSED');

    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Bob',
        lastName: 'Explorer',
        email: emailUser2,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const reg2Data = await reg2Res.json();
    token2 = reg2Data.token;
    user2 = reg2Data.user;
    console.log('  ✅ User 2 Registration PASSED');

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailUser1, password: 'Password123!' }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error('Module 1: Login failed!');
    }
    console.log('  ✅ Login & JWT Authentication PASSED');

    const profileRes = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const profileData = await profileRes.json();
    if (profileRes.status !== 200 || profileData.user.email !== emailUser1) {
      throw new Error('Module 1: Get profile failed!');
    }
    console.log('  ✅ Get Profile PASSED');

    const updateProfRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ bio: 'Avid globe trotter & photography enthusiast' }),
    });
    const updateProfData = await updateProfRes.json();
    if (updateProfRes.status !== 200 || updateProfData.user.bio !== 'Avid globe trotter & photography enthusiast') {
      throw new Error('Module 1: Update profile failed!');
    }
    console.log('  ✅ Profile Update PASSED');

    // ------------------------------------------------------------------
    // MODULE 2: TRIPS MANAGEMENT
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 2: Trips Management ---');
    const createTripRes = await fetch(`${baseUrl}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        name: 'Grand European Tour 2027',
        description: 'Paris, Rome and Venice adventure',
        startDate: '2027-08-01T00:00:00.000Z',
        endDate: '2027-08-15T00:00:00.000Z',
        budget: 5000.00,
        currency: 'USD',
        travelers: 2,
        travelStyle: 'Luxury & Culture',
      }),
    });
    const createTripData = await createTripRes.json();
    if (createTripRes.status !== 201 || !createTripData.trip) {
      throw new Error('Module 2: Create trip failed!');
    }
    trip1 = createTripData.trip;
    console.log(`  ✅ Create Trip PASSED (Trip ID: ${trip1.id}, Status: ${trip1.status})`);

    const updateTripRes = await fetch(`${baseUrl}/trips/${trip1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ budget: 5500.00 }),
    });
    if (updateTripRes.status !== 200) throw new Error('Module 2: Update trip failed!');
    console.log('  ✅ Update Trip PASSED');

    // ------------------------------------------------------------------
    // MODULE 3: CITIES & TRIP STOPS
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 3: Cities & Trip Stops ---');
    cityParis = await prisma.city.findFirst({ where: { name: { contains: 'Paris', mode: 'insensitive' } } });
    cityRome = await prisma.city.findFirst({ where: { name: { contains: 'Rome', mode: 'insensitive' } } });

    if (!cityParis || !cityRome) {
      const cities = await prisma.city.findMany({ take: 2 });
      cityParis = cities[0];
      cityRome = cities[1];
    }

    const addStop1Res = await fetch(`${baseUrl}/trips/${trip1.id}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        cityId: cityParis.id,
        startDate: '2027-08-02T00:00:00.000Z',
        endDate: '2027-08-07T00:00:00.000Z',
        orderIndex: 1,
        notes: 'Stay at Le Marais Hotel',
      }),
    });
    const addStop1Data = await addStop1Res.json();
    if (addStop1Res.status !== 201 || !addStop1Data.stop) throw new Error('Module 3: Add city stop failed!');
    stop1 = addStop1Data.stop;
    console.log('  ✅ Add City Stop PASSED');

    const addStop2Res = await fetch(`${baseUrl}/trips/${trip1.id}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        cityId: cityRome.id,
        startDate: '2027-08-08T00:00:00.000Z',
        endDate: '2027-08-14T00:00:00.000Z',
        orderIndex: 2,
      }),
    });
    const addStop2Data = await addStop2Res.json();
    const stop2 = addStop2Data.stop;

    const reorderStopsRes = await fetch(`${baseUrl}/trips/${trip1.id}/stops/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        stopIds: [stop2.id, stop1.id],
      }),
    });
    if (reorderStopsRes.status !== 200) throw new Error('Module 3: Reorder city stops failed!');
    console.log('  ✅ Reorder City Stops PASSED');

    // ------------------------------------------------------------------
    // MODULE 4: ACTIVITIES & TRIP ACTIVITIES
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 4: Activities & Trip Activities ---');
    actEiffel = await prisma.activity.findFirst();
    const addActRes = await fetch(`${baseUrl}/trips/${trip1.id}/stops/${stop1.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        activityId: actEiffel.id,
        date: '2027-08-03T00:00:00.000Z',
        startTime: '10:00',
        duration: 120,
        cost: 45.00,
        notes: 'Skip-the-line summit tickets',
      }),
    });
    const addActData = await addActRes.json();
    if (addActRes.status !== 201 || !addActData.tripActivity) throw new Error('Module 4: Add trip activity failed!');
    tripActivity1 = addActData.tripActivity;
    console.log('  ✅ Add Trip Activity PASSED');

    // ------------------------------------------------------------------
    // MODULE 5: EXPENSES & BUDGET ENGINE
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 5: Expenses & Budget Engine ---');
    const addExpRes = await fetch(`${baseUrl}/trips/${trip1.id}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        category: 'ACCOMMODATION',
        amount: 2000.00,
        description: 'Boutique Hotel Stay',
        date: '2027-08-02T00:00:00.000Z',
      }),
    });
    const addExpData = await addExpRes.json();
    if (addExpRes.status !== 201 || !addExpData.expense) throw new Error('Module 5: Add expense failed!');
    expense1 = addExpData.expense;
    console.log('  ✅ Add Expense PASSED');

    const budgetRes = await fetch(`${baseUrl}/trips/${trip1.id}/budget`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const budgetData = await budgetRes.json();
    if (budgetRes.status !== 200 || budgetData.data.totalCost < 2000) throw new Error('Module 5: Budget calculation failed!');
    console.log('  ✅ Budget Overview & Calculation PASSED');

    const healthRes = await fetch(`${baseUrl}/trips/${trip1.id}/budget/health`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || !healthData.data || healthData.data.score === undefined) throw new Error('Module 5: Trip health score failed!');
    console.log(`  ✅ Trip Health Score PASSED (Score: ${healthData.data.score})`);

    // ------------------------------------------------------------------
    // MODULE 6: CALENDAR & TIMELINE
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 6: Calendar & Timeline ---');
    const calRes = await fetch(`${baseUrl}/trips/${trip1.id}/calendar`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const calData = await calRes.json();
    if (calRes.status !== 200 || !calData.data) throw new Error('Module 6: Calendar endpoint failed!');
    console.log('  ✅ Calendar Schedule PASSED');

    const timelineRes = await fetch(`${baseUrl}/trips/${trip1.id}/timeline`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const timelineData = await timelineRes.json();
    if (timelineRes.status !== 200 || !timelineData.data) throw new Error('Module 6: Timeline endpoint failed!');
    console.log('  ✅ Itinerary Timeline PASSED');

    // ------------------------------------------------------------------
    // MODULE 7: SHARING & COMMUNITY
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 7: Sharing & Community ---');
    const shareRes = await fetch(`${baseUrl}/trips/${trip1.id}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const shareData = await shareRes.json();
    if (shareRes.status !== 200 || !shareData.data.shareToken) throw new Error('Module 7: Enable sharing failed!');
    shareToken1 = shareData.data.shareToken;
    console.log('  ✅ Enable Trip Sharing PASSED');

    const publicRes = await fetch(`${baseUrl}/public/trips/${shareToken1}`);
    const publicData = await publicRes.json();
    if (publicRes.status !== 200 || !publicData.data.cities || JSON.stringify(publicData).includes('passwordHash')) {
      throw new Error('Module 7: Public trip view failed or exposed private user data!');
    }
    console.log('  ✅ Public Trip View PASSED');

    const copyRes = await fetch(`${baseUrl}/public/trips/${shareToken1}/copy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });
    const copyData = await copyRes.json();
    if (copyRes.status !== 201 || copyData.trip.userId !== user2.id) throw new Error('Module 7: Copy public trip failed!');
    console.log('  ✅ Copy Public Trip PASSED');

    const postRes = await fetch(`${baseUrl}/community/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ tripId: trip1.id, content: 'Excited for my upcoming trip!' }),
    });
    const postData = await postRes.json();
    if (postRes.status !== 201 || !postData.post) throw new Error('Module 7: Create community post failed!');
    postId1 = postData.post.id;
    console.log('  ✅ Community Post Creation PASSED');

    const likeRes = await fetch(`${baseUrl}/community/posts/${postId1}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (likeRes.status !== 200) throw new Error('Module 7: Like post failed!');
    console.log('  ✅ Like Post PASSED');

    const commentRes = await fetch(`${baseUrl}/community/posts/${postId1}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ content: 'Have a great time in Europe!' }),
    });
    if (commentRes.status !== 201) throw new Error('Module 7: Add comment failed!');
    console.log('  ✅ Comment on Post PASSED');

    // ------------------------------------------------------------------
    // MODULE 8: NOTIFICATIONS
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 8: Notifications ---');
    const notifsRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const notifsData = await notifsRes.json();
    if (notifsRes.status !== 200 || !Array.isArray(notifsData.data) || notifsData.data.length === 0) {
      throw new Error('Module 8: GET notifications failed!');
    }
    notifId1 = notifsData.data[0].id;
    console.log('  ✅ Get Notifications PASSED');

    const markReadRes = await fetch(`${baseUrl}/notifications/${notifId1}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (markReadRes.status !== 200) throw new Error('Module 8: Mark read failed!');
    console.log('  ✅ Mark Notification Read PASSED');

    const markAllRes = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (markAllRes.status !== 200) throw new Error('Module 8: Mark all read failed!');
    console.log('  ✅ Mark All Notifications Read PASSED');

    // ------------------------------------------------------------------
    // MODULE 9: ADMIN & ROLE-BASED AUTHORIZATION
    // ------------------------------------------------------------------
    console.log('\n--- MODULE 9: Admin & Security ---');
    // Verify non-admin blocked with 403
    const unauthAdminRes = await fetch(`${baseUrl}/admin/statistics`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (unauthAdminRes.status !== 403) throw new Error('Module 9: Non-admin authorization check failed!');
    console.log('  ✅ Non-Admin Authorization Block PASSED (403 Forbidden)');

    // Setup Admin user
    const adminRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Master',
        lastName: 'Admin',
        email: emailAdmin,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const adminRegData = await adminRegRes.json();
    tokenAdmin = adminRegData.token;
    userAdmin = adminRegData.user;

    await prisma.user.update({
      where: { id: userAdmin.id },
      data: { role: 'ADMIN' },
    });

    const adminStatsRes = await fetch(`${baseUrl}/admin/statistics`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const adminStatsData = await adminStatsRes.json();
    if (adminStatsRes.status !== 200 || adminStatsData.data.totalUsers === undefined) {
      throw new Error('Module 9: Admin statistics failed!');
    }
    console.log('  ✅ Admin System Statistics PASSED');

    const adminUsersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (adminUsersRes.status !== 200 || JSON.stringify(await adminUsersRes.json()).includes('passwordHash')) {
      throw new Error('Module 9: Admin users list failed or exposed passwordHash!');
    }
    console.log('  ✅ Admin User Listing PASSED');

    const popularCitiesRes = await fetch(`${baseUrl}/admin/popular-cities`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (popularCitiesRes.status !== 200) throw new Error('Module 9: Admin popular cities failed!');
    console.log('  ✅ Admin Popular Cities PASSED');

    const popularActsRes = await fetch(`${baseUrl}/admin/popular-activities`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (popularActsRes.status !== 200) throw new Error('Module 9: Admin popular activities failed!');
    console.log('  ✅ Admin Popular Activities PASSED');

    const trendsRes = await fetch(`${baseUrl}/admin/user-trends`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (trendsRes.status !== 200) throw new Error('Module 9: Admin user trends failed!');
    console.log('  ✅ Admin User Trends PASSED');

    // ------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------
    console.log('\n--- CLEANUP ---');
    await prisma.notification.deleteMany({ where: { userId: { in: [user1.id, user2.id, userAdmin.id] } } });
    await prisma.communityPost.deleteMany({ where: { userId: { in: [user1.id, user2.id, userAdmin.id] } } });
    await prisma.trip.deleteMany({ where: { userId: { in: [user1.id, user2.id, userAdmin.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id, userAdmin.id] } } });
    console.log('  🧹 Master E2E test data cleaned up.');

    console.log('===============================================================');
    console.log('🎉 ALL VOYAGEIQ BACKEND MODULES & INTEGRATION TESTS PASSED 100%!');
    console.log('===============================================================');
  } catch (err) {
    console.error('\n❌ Master E2E Test Failure:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runMasterE2ETests();
