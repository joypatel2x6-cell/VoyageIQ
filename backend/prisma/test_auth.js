const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testAuth() {
  console.log('🧪 Starting Auth API Integration Tests...');

  // Start temporary HTTP server on random port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1/auth`;

  let testToken = null;
  let testUser = null;

  const testEmail = `test.user.${Date.now()}@example.com`;

  try {
    // ----------------------------------------------------
    // TEST 1: Registration - Successful
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Registration (Success) ---');
    const regPayload = {
      firstName: 'Alice',
      lastName: 'Smith',
      email: testEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      city: 'Seattle',
      country: 'United States',
      bio: 'Travel enthusiast and tech explorer.',
      language: 'en',
    };

    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });
    const regData = await regRes.json();

    console.log(`Status: ${regRes.status}`);
    console.log('Response Body:', JSON.stringify(regData, null, 2));

    if (regRes.status !== 201 || !regData.token || !regData.user) {
      throw new Error('Registration failed!');
    }
    if (regData.user.passwordHash) {
      throw new Error('SECURITY VIOLATION: passwordHash leaked in registration response!');
    }

    testToken = regData.token;
    testUser = regData.user;
    console.log('✅ Registration test PASSED');

    // ----------------------------------------------------
    // TEST 2: Registration - Duplicate Email (Conflict)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Duplicate Email Registration (409 Conflict) ---');
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });
    const dupData = await dupRes.json();
    console.log(`Status: ${dupRes.status}`);
    console.log('Response Body:', JSON.stringify(dupData, null, 2));
    if (dupRes.status !== 409) {
      throw new Error('Duplicate email registration did not return 409 status!');
    }
    console.log('✅ Duplicate email check PASSED');

    // ----------------------------------------------------
    // TEST 3: Registration - Password Mismatch Validation
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Password Mismatch Validation (400 Bad Request) ---');
    const mismatchRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...regPayload,
        email: `mismatch.${Date.now()}@example.com`,
        confirmPassword: 'DifferentPassword123!',
      }),
    });
    const mismatchData = await mismatchRes.json();
    console.log(`Status: ${mismatchRes.status}`);
    console.log('Response Body:', JSON.stringify(mismatchData, null, 2));
    if (mismatchRes.status !== 400) {
      throw new Error('Password mismatch did not trigger 400 Bad Request!');
    }
    console.log('✅ Password mismatch validation PASSED');

    // ----------------------------------------------------
    // TEST 4: Login - Successful Credentials
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Login (Success) ---');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);
    console.log('Response Body:', JSON.stringify(loginData, null, 2));

    if (loginRes.status !== 200 || !loginData.token || !loginData.user) {
      throw new Error('Login failed!');
    }
    if (loginData.user.passwordHash) {
      throw new Error('SECURITY VIOLATION: passwordHash leaked in login response!');
    }
    console.log('✅ Login test PASSED');

    // ----------------------------------------------------
    // TEST 5: Login - Invalid Password (Generic Error 401)
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Login with Invalid Password (401 Unauthorized) ---');
    const invalidPassRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });
    const invalidPassData = await invalidPassRes.json();
    console.log(`Status: ${invalidPassRes.status}`);
    console.log('Response Body:', JSON.stringify(invalidPassData, null, 2));

    if (invalidPassRes.status !== 401 || invalidPassData.message !== 'Invalid email or password') {
      throw new Error('Invalid password response failed security requirement!');
    }
    console.log('✅ Invalid credentials security check PASSED');

    // ----------------------------------------------------
    // TEST 6: GET /auth/me - Protected Route with Bearer Token
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Protected GET /auth/me (Success) ---');
    const meRes = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });
    const meData = await meRes.json();
    console.log(`Status: ${meRes.status}`);
    console.log('Response Body:', JSON.stringify(meData, null, 2));

    if (meRes.status !== 200 || meData.user.email !== testEmail) {
      throw new Error('GET /auth/me failed!');
    }
    if (meData.user.passwordHash) {
      throw new Error('SECURITY VIOLATION: passwordHash leaked in /me profile!');
    }
    console.log('✅ Protected /auth/me test PASSED');

    // ----------------------------------------------------
    // TEST 7: GET /auth/me - Missing Token (401 Unauthorized)
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Protected GET /auth/me with Missing Token (401) ---');
    const unauthRes = await fetch(`${baseUrl}/me`, {
      method: 'GET',
    });
    const unauthData = await unauthRes.json();
    console.log(`Status: ${unauthRes.status}`);
    console.log('Response Body:', JSON.stringify(unauthData, null, 2));

    if (unauthRes.status !== 401) {
      throw new Error('Unauthenticated request was not blocked with 401!');
    }
    console.log('✅ Unauthenticated access protection PASSED');

    // ----------------------------------------------------
    // TEST 8: POST /auth/logout
    // ----------------------------------------------------
    console.log('\n--- 8. Testing Logout ---');
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });
    const logoutData = await logoutRes.json();
    console.log(`Status: ${logoutRes.status}`);
    console.log('Response Body:', JSON.stringify(logoutData, null, 2));

    if (logoutRes.status !== 200 || !logoutData.success) {
      throw new Error('Logout failed!');
    }
    console.log('✅ Logout test PASSED');

    // Cleanup created test user
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('\n🧹 Test user cleaned up.');

    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Auth Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testAuth();
