const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testAdminModule() {
  console.log('🧪 Starting Admin Backend API & Analytics Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const timestamp = Date.now();
  const emailNormal = `normal.user.${timestamp}@example.com`;
  const emailAdmin = `admin.user.${timestamp}@example.com`;

  let tokenNormal = null;
  let userNormal = null;
  let tokenAdmin = null;
  let userAdmin = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register two test users & promote one to ADMIN
    // ----------------------------------------------------
    console.log('\n--- SETUP: Registering Normal User and Admin User ---');
    const normRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Norm',
        lastName: 'User',
        email: emailNormal,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const normRegData = await normRegRes.json();
    tokenNormal = normRegData.token;
    userNormal = normRegData.user;

    const adminRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Super',
        lastName: 'Admin',
        email: emailAdmin,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const adminRegData = await adminRegRes.json();
    tokenAdmin = adminRegData.token;
    userAdmin = adminRegData.user;

    // Promote userAdmin to ADMIN in database
    await prisma.user.update({
      where: { id: userAdmin.id },
      data: { role: 'ADMIN' },
    });
    userAdmin.role = 'ADMIN';

    console.log(`Normal User ID: ${userNormal.id} (Role: ${userNormal.role})`);
    console.log(`Admin User ID: ${userAdmin.id} (Role: ${userAdmin.role})`);

    // ----------------------------------------------------
    // TEST 1: Security Authorization - Normal user blocked (403 Forbidden)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Normal User Access Block (403 Forbidden) ---');
    const statBlockedRes = await fetch(`${baseUrl}/admin/statistics`, {
      headers: { Authorization: `Bearer ${tokenNormal}` },
    });
    console.log(`Blocked Stat Status: ${statBlockedRes.status}`);

    const usersBlockedRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${tokenNormal}` },
    });
    console.log(`Blocked Users Status: ${usersBlockedRes.status}`);

    if (statBlockedRes.status !== 403 || usersBlockedRes.status !== 403) {
      throw new Error('SECURITY VIOLATION: Normal user was able to access admin endpoints!');
    }
    console.log('✅ Non-admin user access blocking PASSED');

    // ----------------------------------------------------
    // TEST 2: GET /api/v1/admin/users (Admin User List)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing GET /api/v1/admin/users (Admin List Users) ---');
    const usersRes = await fetch(`${baseUrl}/admin/users?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const usersData = await usersRes.json();
    console.log(`Users List Status: ${usersRes.status}`);
    console.log('Total Users Count:', usersData.pagination.total);

    if (usersRes.status !== 200 || !Array.isArray(usersData.data)) {
      throw new Error('GET /api/v1/admin/users failed!');
    }

    // Security check: Ensure passwordHash is omitted
    const serializedUsers = JSON.stringify(usersData);
    if (serializedUsers.includes('passwordHash')) {
      throw new Error('SECURITY VIOLATION: passwordHash exposed in admin users list!');
    }
    console.log('✅ GET /api/v1/admin/users PASSED');

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/admin/users/:userId (User Details)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing GET /api/v1/admin/users/:userId ---');
    const detailRes = await fetch(`${baseUrl}/admin/users/${userNormal.id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const detailData = await detailRes.json();
    console.log(`User Detail Status: ${detailRes.status}`);

    if (detailRes.status !== 200 || !detailData.user || detailData.user.id !== userNormal.id) {
      throw new Error('GET /api/v1/admin/users/:userId failed!');
    }

    if (JSON.stringify(detailData).includes('passwordHash')) {
      throw new Error('SECURITY VIOLATION: passwordHash exposed in admin user detail!');
    }
    console.log('✅ GET /api/v1/admin/users/:userId PASSED');

    // ----------------------------------------------------
    // TEST 4: PATCH /api/v1/admin/users/:userId/status (Deactivate & Reactivate)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing PATCH /api/v1/admin/users/:userId/status ---');
    // Deactivate userNormal
    const deactRes = await fetch(`${baseUrl}/admin/users/${userNormal.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    const deactData = await deactRes.json();
    console.log(`Deactivate Status: ${deactRes.status}, isActive: ${deactData.user?.isActive}`);

    if (deactRes.status !== 200 || deactData.user.isActive !== false) {
      throw new Error('Admin deactivate user status update failed!');
    }

    // Verify deactivated user is blocked from making API calls
    const deactLoginAttemptRes = await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${tokenNormal}` },
    });
    console.log(`Deactivated User Access Status: ${deactLoginAttemptRes.status}`);
    if (deactLoginAttemptRes.status !== 403) {
      throw new Error('Deactivated user was not blocked from making requests!');
    }

    // Reactivate userNormal
    const reactRes = await fetch(`${baseUrl}/admin/users/${userNormal.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ isActive: true }),
    });
    const reactData = await reactRes.json();
    console.log(`Reactivate Status: ${reactRes.status}, isActive: ${reactData.user?.isActive}`);
    if (reactRes.status !== 200 || reactData.user.isActive !== true) {
      throw new Error('Admin reactivate user status update failed!');
    }
    console.log('✅ Admin User Deactivation & Reactivation PASSED');

    // ----------------------------------------------------
    // TEST 5: Self-Modification Protection (Admin cannot deactivate/delete self)
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Self-Modification Protection ---');
    const selfDeactRes = await fetch(`${baseUrl}/admin/users/${userAdmin.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    console.log(`Self Deactivate Status: ${selfDeactRes.status}`);

    const selfDelRes = await fetch(`${baseUrl}/admin/users/${userAdmin.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    console.log(`Self Delete Status: ${selfDelRes.status}`);

    if (selfDeactRes.status !== 400 || selfDelRes.status !== 400) {
      throw new Error('Self-modification protection failed!');
    }
    console.log('✅ Admin self-modification protection PASSED');

    // ----------------------------------------------------
    // TEST 6: DELETE /api/v1/admin/users/:userId (Admin Delete User)
    // ----------------------------------------------------
    console.log('\n--- 6. Testing DELETE /api/v1/admin/users/:userId ---');
    const delRes = await fetch(`${baseUrl}/admin/users/${userNormal.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    console.log(`Delete User Status: ${delRes.status}`);

    if (delRes.status !== 200) {
      throw new Error('DELETE /api/v1/admin/users/:userId failed!');
    }
    console.log('✅ Admin Delete User PASSED');

    // ----------------------------------------------------
    // TEST 7: GET /api/v1/admin/statistics
    // ----------------------------------------------------
    console.log('\n--- 7. Testing GET /api/v1/admin/statistics ---');
    const statRes = await fetch(`${baseUrl}/admin/statistics`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const statData = await statRes.json();
    console.log(`Statistics Status: ${statRes.status}`);
    console.log('Statistics Data:', JSON.stringify(statData.data, null, 2));

    if (
      statRes.status !== 200 ||
      statData.data.totalUsers === undefined ||
      statData.data.totalTrips === undefined ||
      statData.data.publicTrips === undefined ||
      statData.data.totalCities === undefined ||
      statData.data.totalActivities === undefined
    ) {
      throw new Error('GET /api/v1/admin/statistics missing required metrics!');
    }
    console.log('✅ GET /api/v1/admin/statistics PASSED');

    // ----------------------------------------------------
    // TEST 8: GET /api/v1/admin/popular-cities
    // ----------------------------------------------------
    console.log('\n--- 8. Testing GET /api/v1/admin/popular-cities ---');
    const citiesRes = await fetch(`${baseUrl}/admin/popular-cities`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const citiesData = await citiesRes.json();
    console.log(`Popular Cities Status: ${citiesRes.status}`);
    console.log('Popular Cities Count:', citiesData.data.length);

    if (citiesRes.status !== 200 || !Array.isArray(citiesData.data)) {
      throw new Error('GET /api/v1/admin/popular-cities failed!');
    }
    console.log('✅ GET /api/v1/admin/popular-cities PASSED');

    // ----------------------------------------------------
    // TEST 9: GET /api/v1/admin/popular-activities
    // ----------------------------------------------------
    console.log('\n--- 9. Testing GET /api/v1/admin/popular-activities ---');
    const actsRes = await fetch(`${baseUrl}/admin/popular-activities`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const actsData = await actsRes.json();
    console.log(`Popular Activities Status: ${actsRes.status}`);
    console.log('Popular Activities Count:', actsData.data.length);

    if (actsRes.status !== 200 || !Array.isArray(actsData.data)) {
      throw new Error('GET /api/v1/admin/popular-activities failed!');
    }
    console.log('✅ GET /api/v1/admin/popular-activities PASSED');

    // ----------------------------------------------------
    // TEST 10: GET /api/v1/admin/user-trends
    // ----------------------------------------------------
    console.log('\n--- 10. Testing GET /api/v1/admin/user-trends ---');
    const trendsRes = await fetch(`${baseUrl}/admin/user-trends`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const trendsData = await trendsRes.json();
    console.log(`User Trends Status: ${trendsRes.status}`);
    console.log('User Trends Data:', JSON.stringify(trendsData.data, null, 2));

    if (trendsRes.status !== 200 || !Array.isArray(trendsData.data)) {
      throw new Error('GET /api/v1/admin/user-trends failed!');
    }
    console.log('✅ GET /api/v1/admin/user-trends PASSED');

    // Cleanup test admin user
    await prisma.user.deleteMany({
      where: { id: userAdmin.id },
    });
    console.log('\n🧹 Test admin user cleaned up.');

    console.log('\n🎉 ALL ADMIN BACKEND MODULE TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Admin Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testAdminModule();
