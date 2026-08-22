const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testCityModule() {
  console.log('🧪 Starting City Discovery API Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1/cities`;

  try {
    // ----------------------------------------------------
    // TEST 1: GET /api/v1/cities (Public Access, No Auth)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing GET /api/v1/cities (Public Access) ---');
    const res1 = await fetch(baseUrl);
    const data1 = await res1.json();
    console.log(`Status: ${res1.status}`);
    console.log(`Fetched ${data1.data.length} cities.`);
    console.log('Pagination:', data1.pagination);

    if (res1.status !== 200 || data1.data.length === 0) {
      throw new Error('GET /cities public fetch failed!');
    }
    console.log('✅ GET /cities public access PASSED');

    // ----------------------------------------------------
    // TEST 2: GET /api/v1/cities?country=France
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Country Filter (country=France) ---');
    const res2 = await fetch(`${baseUrl}?country=France`);
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log('Matching City:', data2.data[0]?.name, 'Country:', data2.data[0]?.country);

    if (res2.status !== 200 || data2.data.length === 0 || data2.data[0].country !== 'France') {
      throw new Error('Country filter failed!');
    }
    console.log('✅ Country filter PASSED');

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/cities/search?q=Paris
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Dedicated Search (q=Paris) ---');
    const res3 = await fetch(`${baseUrl}/search?q=Paris`);
    const data3 = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log('Search Match:', data3.data[0]?.name);

    if (res3.status !== 200 || data3.data.length === 0 || data3.data[0].name !== 'Paris') {
      throw new Error('Search failed!');
    }
    console.log('✅ Dedicated city search PASSED');

    // ----------------------------------------------------
    // TEST 4: GET /api/v1/cities?sort=popularity
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Sorting (sort=popularity) ---');
    const res4 = await fetch(`${baseUrl}?sort=popularity&limit=5`);
    const data4 = await res4.json();
    console.log(`Status: ${res4.status}`);
    console.log('Top Popular Cities:', data4.data.map(c => `${c.name} (${c.popularity})`).join(', '));

    if (res4.status !== 200 || data4.data.length === 0) {
      throw new Error('Sorting failed!');
    }
    // Verify descending order
    for (let i = 0; i < data4.data.length - 1; i++) {
      if (data4.data[i].popularity < data4.data[i + 1].popularity) {
        throw new Error('Popularity sorting order incorrect!');
      }
    }
    console.log('✅ Popularity sorting PASSED');

    // ----------------------------------------------------
    // TEST 5: GET /api/v1/cities/:cityId
    // ----------------------------------------------------
    console.log('\n--- 5. Testing GET /api/v1/cities/:cityId ---');
    const targetCity = data1.data[0];
    const res5 = await fetch(`${baseUrl}/${targetCity.id}`);
    const data5 = await res5.json();
    console.log(`Status: ${res5.status}`);
    console.log('City Detail:', data5.city.name, 'Description:', data5.city.description?.substring(0, 40));

    if (res5.status !== 200 || data5.city.id !== targetCity.id) {
      throw new Error('GET /cities/:cityId failed!');
    }
    console.log('✅ City detail PASSED');

    // ----------------------------------------------------
    // TEST 6: GET /api/v1/cities/:cityId/activities
    // ----------------------------------------------------
    console.log('\n--- 6. Testing GET /api/v1/cities/:cityId/activities ---');
    const res6 = await fetch(`${baseUrl}/${targetCity.id}/activities`);
    const data6 = await res6.json();
    console.log(`Status: ${res6.status}`);
    console.log(`City: ${data6.city.name}, Activities Count: ${data6.data.length}`);
    if (data6.data.length > 0) {
      console.log('First Activity:', data6.data[0].name, 'Category:', data6.data[0].category);
    }

    if (res6.status !== 200 || !data6.city) {
      throw new Error('GET /cities/:cityId/activities failed!');
    }
    console.log('✅ City activities PASSED');

    console.log('\n🎉 ALL CITY DISCOVERY API TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ City Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testCityModule();
