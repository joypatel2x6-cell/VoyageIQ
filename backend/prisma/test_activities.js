const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testActivityModule() {
  console.log('🧪 Starting Activity Discovery API Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  try {
    // ----------------------------------------------------
    // TEST 1: GET /api/v1/activities (Public Listing)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing GET /api/v1/activities (Public Listing) ---');
    const res1 = await fetch(`${baseUrl}/activities`);
    const data1 = await res1.json();
    console.log(`Status: ${res1.status}`);
    console.log(`Fetched ${data1.data.length} activities.`);
    console.log('Pagination:', data1.pagination);

    if (res1.status !== 200 || data1.data.length === 0) {
      throw new Error('GET /activities public listing failed!');
    }
    const sampleActivity = data1.data[0];
    if (!sampleActivity.city) {
      throw new Error('Activity response missing nested city details!');
    }
    console.log('✅ GET /activities public listing PASSED');

    // ----------------------------------------------------
    // TEST 2: GET /api/v1/activities?category=CULTURE
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Category Filter (category=CULTURE) ---');
    const res2 = await fetch(`${baseUrl}/activities?category=CULTURE`);
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log(`Found ${data2.data.length} CULTURE activities.`);
    if (data2.data.length > 0) {
      console.log('First Activity:', data2.data[0].name, 'Category:', data2.data[0].category);
    }

    if (res2.status !== 200 || data2.data.some(a => a.category !== 'CULTURE')) {
      throw new Error('Category filter failed!');
    }
    console.log('✅ Category filter PASSED');

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/activities/search?q=Eiffel
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Dedicated Search (q=Eiffel) ---');
    const res3 = await fetch(`${baseUrl}/activities/search?q=Eiffel`);
    const data3 = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log('Search Match:', data3.data[0]?.name);

    if (res3.status !== 200 || data3.data.length === 0 || !data3.data[0].name.includes('Eiffel')) {
      throw new Error('Activity search failed!');
    }
    console.log('✅ Activity text search PASSED');

    // ----------------------------------------------------
    // TEST 4: GET /api/v1/activities?sort=costLow
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Sorting (sort=costLow) ---');
    const res4 = await fetch(`${baseUrl}/activities?sort=costLow&limit=5`);
    const data4 = await res4.json();
    console.log(`Status: ${res4.status}`);
    console.log('Costs:', data4.data.map(a => `${a.name} ($${a.cost})`).join(', '));

    if (res4.status !== 200 || data4.data.length === 0) {
      throw new Error('Cost sorting failed!');
    }
    for (let i = 0; i < data4.data.length - 1; i++) {
      if (parseFloat(data4.data[i].cost) > parseFloat(data4.data[i + 1].cost)) {
        throw new Error('costLow sorting order incorrect!');
      }
    }
    console.log('✅ Cost low sorting PASSED');

    // ----------------------------------------------------
    // TEST 5: GET /api/v1/activities/:activityId
    // ----------------------------------------------------
    console.log('\n--- 5. Testing GET /api/v1/activities/:activityId ---');
    const res5 = await fetch(`${baseUrl}/activities/${sampleActivity.id}`);
    const data5 = await res5.json();
    console.log(`Status: ${res5.status}`);
    console.log('Activity Name:', data5.activity.name, 'City:', data5.activity.city.name);

    if (res5.status !== 200 || data5.activity.id !== sampleActivity.id) {
      throw new Error('GET /activities/:activityId failed!');
    }
    console.log('✅ Activity detail PASSED');

    // ----------------------------------------------------
    // TEST 6: GET /api/v1/cities/:cityId/activities
    // ----------------------------------------------------
    console.log('\n--- 6. Testing GET /api/v1/cities/:cityId/activities ---');
    const targetCityId = sampleActivity.cityId;
    const res6 = await fetch(`${baseUrl}/cities/${targetCityId}/activities`);
    const data6 = await res6.json();
    console.log(`Status: ${res6.status}`);
    console.log(`City: ${data6.city.name}, Activities: ${data6.data.length}`);

    if (res6.status !== 200 || data6.data.length === 0) {
      throw new Error('GET /cities/:cityId/activities failed!');
    }
    console.log('✅ City activities endpoint PASSED');

    console.log('\n🎉 ALL ACTIVITY DISCOVERY API TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Activity Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testActivityModule();
