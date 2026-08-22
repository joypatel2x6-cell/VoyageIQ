const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testNotificationModule() {
  console.log('🧪 Starting Notification Backend API & Event Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const timestamp = Date.now();
  const emailUser1 = `notif.user1.${timestamp}@example.com`;
  const emailUser2 = `notif.user2.${timestamp}@example.com`;

  let token1 = null;
  let user1 = null;
  let token2 = null;
  let user2 = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register two test users
    // ----------------------------------------------------
    console.log('\n--- SETUP: Registering User 1 and User 2 ---');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Alice',
        lastName: 'Notifier',
        email: emailUser1,
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
        firstName: 'Bob',
        lastName: 'Interact',
        email: emailUser2,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const reg2Data = await reg2Res.json();
    token2 = reg2Data.token;
    user2 = reg2Data.user;

    console.log(`User 1 ID: ${user1.id}, User 2 ID: ${user2.id}`);

    // Create a initial seed notification for User 1
    const initialNotif = await prisma.notification.create({
      data: {
        userId: user1.id,
        title: 'Welcome to VoyageIQ',
        message: 'Your account has been set up successfully.',
        type: 'SYSTEM',
      },
    });

    // ----------------------------------------------------
    // TEST 1: GET /api/v1/notifications
    // ----------------------------------------------------
    console.log('\n--- 1. Testing GET /api/v1/notifications ---');
    const getRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const getData = await getRes.json();
    console.log(`Get Status: ${getRes.status}`);
    console.log('Notifications Count:', getData.data.length);
    console.log('First Notification:', JSON.stringify(getData.data[0], null, 2));

    if (getRes.status !== 200 || !Array.isArray(getData.data) || getData.data.length === 0) {
      throw new Error('GET /api/v1/notifications failed!');
    }

    const notifItem = getData.data[0];
    if (
      !notifItem.id ||
      !notifItem.title ||
      !notifItem.message ||
      !notifItem.type ||
      notifItem.isRead === undefined ||
      !notifItem.createdAt
    ) {
      throw new Error('Notification object missing required response fields (id, title, message, type, isRead, createdAt)!');
    }
    console.log('✅ GET /api/v1/notifications PASSED');

    // ----------------------------------------------------
    // TEST 2: PATCH /api/v1/notifications/:notificationId/read (Mark Single Read)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing PATCH /api/v1/notifications/:notificationId/read ---');
    const readRes = await fetch(`${baseUrl}/notifications/${initialNotif.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const readData = await readRes.json();
    console.log(`Mark Read Status: ${readRes.status}`);

    if (readRes.status !== 200 || !readData.notification || readData.notification.isRead !== true) {
      throw new Error('PATCH /notifications/:id/read failed to update isRead status!');
    }
    console.log('✅ Mark single notification as read PASSED');

    // ----------------------------------------------------
    // TEST 3: PATCH /api/v1/notifications/read-all (Mark All Read)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing PATCH /api/v1/notifications/read-all ---');
    // Create two unread notifications for User 1
    await prisma.notification.createMany({
      data: [
        { userId: user1.id, title: 'Alert 1', message: 'Message 1', type: 'SYSTEM' },
        { userId: user1.id, title: 'Alert 2', message: 'Message 2', type: 'SYSTEM' },
      ],
    });

    const readAllRes = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const readAllData = await readAllRes.json();
    console.log(`Mark All Read Status: ${readAllRes.status}`);
    console.log('Updated Count:', readAllData.count);

    if (readAllRes.status !== 200 || readAllData.count < 2) {
      throw new Error('PATCH /notifications/read-all failed to update unread notifications!');
    }
    console.log('✅ Mark all notifications as read PASSED');

    // ----------------------------------------------------
    // TEST 4: DELETE /api/v1/notifications/:notificationId (Delete Single)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing DELETE /api/v1/notifications/:notificationId ---');
    const delRes = await fetch(`${baseUrl}/notifications/${initialNotif.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const delData = await delRes.json();
    console.log(`Delete Status: ${delRes.status}`);

    if (delRes.status !== 200) {
      throw new Error('DELETE /notifications/:id failed!');
    }

    const checkDeleted = await prisma.notification.findUnique({ where: { id: initialNotif.id } });
    if (checkDeleted) {
      throw new Error('Notification record was not deleted from database!');
    }
    console.log('✅ Delete notification PASSED');

    // ----------------------------------------------------
    // TEST 5: Access Control Protection (User 2 cannot touch User 1's notification)
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Privacy & Access Control Protection ---');
    const user1Notif = await prisma.notification.create({
      data: { userId: user1.id, title: 'Private Alert', message: 'Secret data', type: 'SYSTEM' },
    });

    const unauthReadRes = await fetch(`${baseUrl}/notifications/${user1Notif.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token2}` },
    });
    console.log(`Unauth Read Status: ${unauthReadRes.status}`);

    const unauthDelRes = await fetch(`${baseUrl}/notifications/${user1Notif.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    console.log(`Unauth Delete Status: ${unauthDelRes.status}`);

    if (unauthReadRes.status !== 403 || unauthDelRes.status !== 403) {
      throw new Error('Access control violation: User 2 was able to read or delete User 1 notification!');
    }
    console.log('✅ Privacy and User Access Control Protection PASSED');

    // ----------------------------------------------------
    // TEST 6: Event Integration - Trip Shared & Trip Copied
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Event Integration: Trip Shared & Trip Copied ---');
    const tripRes = await fetch(`${baseUrl}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        name: 'Kyoto Tea Garden Tour 2027',
        startDate: '2027-09-01T00:00:00.000Z',
        endDate: '2027-09-05T00:00:00.000Z',
        budget: 2000.00,
      }),
    });
    const tripData = await tripRes.json();
    const tripId = tripData.trip.id;

    // Share trip -> expect TRIP_SHARED notification for User 1
    const shareRes = await fetch(`${baseUrl}/trips/${tripId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const shareData = await shareRes.json();
    const shareToken = shareData.data.shareToken;

    const notifShared = await prisma.notification.findFirst({
      where: { userId: user1.id, type: 'TRIP_SHARED' },
    });
    if (!notifShared) {
      throw new Error('TRIP_SHARED event notification was not created when sharing trip!');
    }
    console.log('✅ TRIP_SHARED notification event PASSED');

    // User 2 copies User 1 trip -> expect TRIP_COPIED notification for User 1
    await fetch(`${baseUrl}/public/trips/${shareToken}/copy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });

    const notifCopied = await prisma.notification.findFirst({
      where: { userId: user1.id, type: 'TRIP_COPIED' },
    });
    if (!notifCopied) {
      throw new Error('TRIP_COPIED event notification was not created for original owner!');
    }
    console.log('✅ TRIP_COPIED notification event PASSED');

    // ----------------------------------------------------
    // TEST 7: Event Integration - Community Interaction (Like / Comment)
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Event Integration: Community Interaction ---');
    const postRes = await fetch(`${baseUrl}/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        tripId,
        content: 'Check out my upcoming tea garden itinerary in Kyoto!',
      }),
    });
    const postData = await postRes.json();
    const postId = postData.post.id;

    // User 2 likes User 1 post
    await fetch(`${baseUrl}/community/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });

    // User 2 comments on User 1 post
    await fetch(`${baseUrl}/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ content: 'Looks super peaceful!' }),
    });

    const interactionNotifs = await prisma.notification.findMany({
      where: { userId: user1.id, type: 'COMMUNITY_INTERACTION' },
    });
    if (interactionNotifs.length < 2) {
      throw new Error('COMMUNITY_INTERACTION event notifications (like/comment) were not created!');
    }
    console.log('✅ COMMUNITY_INTERACTION notification events PASSED');

    // ----------------------------------------------------
    // TEST 8: Event Integration - Budget Exceeded
    // ----------------------------------------------------
    console.log('\n--- 8. Testing Event Integration: Budget Exceeded ---');
    // Add expense of 2500 to trip with budget 2000
    await fetch(`${baseUrl}/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        category: 'ACCOMMODATION',
        amount: 2500.00,
        description: 'Luxury Villa',
      }),
    });

    const budgetNotif = await prisma.notification.findFirst({
      where: { userId: user1.id, type: 'BUDGET_EXCEEDED' },
    });
    if (!budgetNotif) {
      throw new Error('BUDGET_EXCEEDED event notification was not created!');
    }
    console.log('✅ BUDGET_EXCEEDED notification event PASSED');

    // ----------------------------------------------------
    // TEST 9: Event Integration - Trip Starting Soon
    // ----------------------------------------------------
    console.log('\n--- 9. Testing Event Integration: Trip Starting Soon ---');
    const soonStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const soonEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const soonTrip = await prisma.trip.create({
      data: {
        userId: user1.id,
        name: 'Urgent Weekend Getaway',
        startDate: soonStart,
        endDate: soonEnd,
        budget: 500.00,
        status: 'UPCOMING',
      },
    });

    // Fetch notifications triggers auto-check for upcoming trips starting within 7 days
    const freshNotifsRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const freshNotifsData = await freshNotifsRes.json();

    const startingSoonNotif = freshNotifsData.data.find((n) => n.type === 'TRIP_STARTING_SOON');
    if (!startingSoonNotif) {
      throw new Error('TRIP_STARTING_SOON automated notification was not generated!');
    }
    console.log('✅ TRIP_STARTING_SOON notification event PASSED');

    // Cleanup
    await prisma.notification.deleteMany({
      where: { userId: { in: [user1.id, user2.id] } },
    });
    await prisma.communityPost.deleteMany({
      where: { userId: { in: [user1.id, user2.id] } },
    });
    await prisma.trip.deleteMany({
      where: { userId: { in: [user1.id, user2.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [user1.id, user2.id] } },
    });
    console.log('\n🧹 Test notifications, trips, posts, and users cleaned up.');

    console.log('\n🎉 ALL NOTIFICATION BACKEND & EVENT TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Notification Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testNotificationModule();
