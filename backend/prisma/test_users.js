const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testUserModule() {
  console.log('🧪 Starting User Profile API Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const testEmail = `user.test.${Date.now()}@example.com`;
  let token = null;
  let userId = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register test user
    // ----------------------------------------------------
    console.log('\n--- SETUP: Registering user ---');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Bob',
        lastName: 'Traveler',
        email: testEmail,
        password: 'OriginalPassword123!',
        confirmPassword: 'OriginalPassword123!',
        city: 'Chicago',
        country: 'United States',
      }),
    });
    const regData = await regRes.json();
    token = regData.token;
    userId = regData.user.id;
    console.log(`Registered User ID: ${userId}`);

    // ----------------------------------------------------
    // TEST 1: GET /api/v1/users/me
    // ----------------------------------------------------
    console.log('\n--- 1. Testing GET /api/v1/users/me ---');
    const getMeRes = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getMeData = await getMeRes.json();
    console.log(`Status: ${getMeRes.status}`);
    console.log('Response Body:', JSON.stringify(getMeData, null, 2));

    if (getMeRes.status !== 200 || getMeData.user.firstName !== 'Bob') {
      throw new Error('GET /users/me failed');
    }
    if (getMeData.user.passwordHash) {
      throw new Error('SECURITY VIOLATION: passwordHash present in /users/me response');
    }
    console.log('✅ GET /users/me PASSED');

    // ----------------------------------------------------
    // TEST 2: PATCH /api/v1/users/me (Update Profile)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing PATCH /api/v1/users/me (Update Profile) ---');
    const updateRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: 'Robert',
        city: 'New York',
        bio: 'Updated bio for Robert.',
      }),
    });
    const updateData = await updateRes.json();
    console.log(`Status: ${updateRes.status}`);
    console.log('Response Body:', JSON.stringify(updateData, null, 2));

    if (updateRes.status !== 200 || updateData.user.firstName !== 'Robert' || updateData.user.city !== 'New York') {
      throw new Error('PATCH /users/me failed');
    }
    console.log('✅ PATCH /users/me PASSED');

    // ----------------------------------------------------
    // TEST 3: PATCH /api/v1/users/me/password
    // ----------------------------------------------------
    console.log('\n--- 3. Testing PATCH /api/v1/users/me/password ---');
    // 3a. Invalid current password
    const badPassRes = await fetch(`${baseUrl}/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword999!',
        newPassword: 'BrandNewPassword123!',
      }),
    });
    const badPassData = await badPassRes.json();
    console.log(`Bad Pass Status: ${badPassRes.status}`);
    if (badPassRes.status !== 400) {
      throw new Error('Incorrect current password check failed');
    }

    // 3b. Valid password change
    const changePassRes = await fetch(`${baseUrl}/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'OriginalPassword123!',
        newPassword: 'BrandNewPassword123!',
      }),
    });
    const changePassData = await changePassRes.json();
    console.log(`Status: ${changePassRes.status}`);
    console.log('Response Body:', JSON.stringify(changePassData, null, 2));

    if (changePassRes.status !== 200) {
      throw new Error('Password change failed');
    }

    // Verify login with new password
    const reloginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'BrandNewPassword123!',
      }),
    });
    if (reloginRes.status !== 200) {
      throw new Error('Login with updated password failed!');
    }
    const reloginData = await reloginRes.json();
    token = reloginData.token; // Update active token
    console.log('✅ Password change & new password login PASSED');

    // ----------------------------------------------------
    // TEST 4: Saved Destinations (GET, POST, DELETE)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Saved Destinations ---');
    const sampleCity = await prisma.city.findFirst();
    if (!sampleCity) {
      throw new Error('No city found in DB for saved destination testing!');
    }

    // 4a. Save destination
    const saveRes = await fetch(`${baseUrl}/users/me/saved-destinations/${sampleCity.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const saveData = await saveRes.json();
    console.log(`Save Status: ${saveRes.status}`);
    console.log('Save Body:', JSON.stringify(saveData, null, 2));

    if (saveRes.status !== 201 || !saveData.savedDestination.city) {
      throw new Error('Save destination failed');
    }

    // 4b. Duplicate save destination (Expect 409)
    const dupSaveRes = await fetch(`${baseUrl}/users/me/saved-destinations/${sampleCity.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`Duplicate Save Status: ${dupSaveRes.status}`);
    if (dupSaveRes.status !== 409) {
      throw new Error('Duplicate saved destination did not return 409');
    }

    // 4c. GET saved destinations
    const getSavedRes = await fetch(`${baseUrl}/users/me/saved-destinations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getSavedData = await getSavedRes.json();
    console.log(`Get Saved Status: ${getSavedRes.status}`);
    console.log('Get Saved Count:', getSavedData.savedDestinations.length);
    if (getSavedRes.status !== 200 || getSavedData.savedDestinations.length !== 1) {
      throw new Error('GET saved destinations failed');
    }

    // 4d. DELETE saved destination
    const delSaveRes = await fetch(`${baseUrl}/users/me/saved-destinations/${sampleCity.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const delSaveData = await delSaveRes.json();
    console.log(`Delete Saved Status: ${delSaveRes.status}`);
    if (delSaveRes.status !== 200) {
      throw new Error('Delete saved destination failed');
    }
    console.log('✅ Saved Destinations endpoints PASSED');

    // ----------------------------------------------------
    // TEST 5: DELETE Account
    // ----------------------------------------------------
    console.log('\n--- 5. Testing DELETE /api/v1/users/me (Delete Account) ---');
    const delAccountRes = await fetch(`${baseUrl}/users/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const delAccountData = await delAccountRes.json();
    console.log(`Status: ${delAccountRes.status}`);
    console.log('Response Body:', JSON.stringify(delAccountData, null, 2));

    if (delAccountRes.status !== 200) {
      throw new Error('Delete account failed');
    }

    // Verify token rejected after account deletion
    const postDelMeRes = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`Post-deletion /me status: ${postDelMeRes.status}`);
    if (postDelMeRes.status !== 401) {
      throw new Error('Deleted user token was not rejected!');
    }
    console.log('✅ Delete Account PASSED');

    console.log('\n🎉 ALL USER PROFILE API TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ User Profile Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testUserModule();
