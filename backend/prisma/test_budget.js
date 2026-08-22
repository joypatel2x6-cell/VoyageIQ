const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testBudgetModule() {
  console.log('🧪 Starting VoyageIQ Smart Budget Engine Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const ownerEmail = `budget.owner.${Date.now()}@example.com`;
  let ownerToken = null;
  let ownerUser = null;
  let tripId = null;
  let expense1Id = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register user & create 5-day trip with $1000 budget
    // ----------------------------------------------------
    console.log('\n--- SETUP: Creating user and base trip ($1000 budget, 5 days) ---');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Budget',
        lastName: 'Planner',
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
        name: 'Autumn in Paris 2027',
        startDate: '2027-10-01T00:00:00.000Z',
        endDate: '2027-10-05T00:00:00.000Z',
        budget: 1000,
        currency: 'USD',
      }),
    });
    const tripData = await tripRes.json();
    tripId = tripData.trip.id;

    // Get Paris & create stop with Louvre Activity ($25)
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
        startDate: '2027-10-01T00:00:00.000Z',
        endDate: '2027-10-05T00:00:00.000Z',
      }),
    });
    const stopData = await stopRes.json();

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
          date: '2027-10-02T00:00:00.000Z',
          cost: 25.00,
        }),
      });
    }

    // ----------------------------------------------------
    // TEST 1: POST /api/v1/trips/:tripId/expenses (Add Expenses)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Add Manual Expenses ---');
    // 1a. Transport ($150)
    const exp1Res = await fetch(`${baseUrl}/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        category: 'TRANSPORT',
        amount: 150,
        currency: 'USD',
        description: 'Roundtrip Flight',
        date: '2027-10-01T00:00:00.000Z',
      }),
    });
    const exp1Data = await exp1Res.json();
    expense1Id = exp1Data.expense.id;
    console.log(`Add Exp 1 (Transport $150) Status: ${exp1Res.status}`);

    // 1b. Accommodation ($500)
    await fetch(`${baseUrl}/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        category: 'ACCOMMODATION',
        amount: 500,
        currency: 'USD',
        description: 'Boutique Hotel Stay',
        date: '2027-10-01T00:00:00.000Z',
      }),
    });

    // 1c. Food ($200)
    await fetch(`${baseUrl}/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        category: 'FOOD',
        amount: 200,
        currency: 'USD',
        description: 'Parisian Bistro Dining',
        date: '2027-10-03T00:00:00.000Z',
      }),
    });

    // 1d. Other ($50)
    await fetch(`${baseUrl}/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        category: 'OTHER',
        amount: 50,
        currency: 'USD',
        description: 'Souvenirs & Travel Sim',
        date: '2027-10-04T00:00:00.000Z',
      }),
    });

    console.log('✅ Manual expenses added successfully');

    // ----------------------------------------------------
    // TEST 2: GET /api/v1/trips/:tripId/budget (Budget Overview)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing GET /api/v1/trips/:tripId/budget ---');
    const budgetRes = await fetch(`${baseUrl}/trips/${tripId}/budget`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const budgetData = await budgetRes.json();
    console.log(`Budget Overview Status: ${budgetRes.status}`);
    console.log('Overview Payload:', JSON.stringify(budgetData.data, null, 2));

    const expectedTotal = 150 + 500 + 200 + 50 + 25; // 925
    if (budgetRes.status !== 200 || budgetData.data.totalCost !== expectedTotal) {
      throw new Error(`Total cost mismatch! Expected ${expectedTotal}, got ${budgetData.data.totalCost}`);
    }
    if (budgetData.data.status !== 'NEAR_LIMIT' || budgetData.data.remaining !== 75) {
      throw new Error('Budget status calculation failed!');
    }
    console.log('✅ Budget overview calculations PASSED');

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/trips/:tripId/budget/daily
    // ----------------------------------------------------
    console.log('\n--- 3. Testing GET /api/v1/trips/:tripId/budget/daily ---');
    const dailyRes = await fetch(`${baseUrl}/trips/${tripId}/budget/daily`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dailyData = await dailyRes.json();
    console.log(`Daily Budget Status: ${dailyRes.status}`);
    console.log(`Duration: ${dailyData.data.durationInDays} days, Average Daily Cost: $${dailyData.data.averageDailyCost}`);
    console.log('Daily Items:', dailyData.data.dailyBreakdown.map(d => `Day ${d.day} (${d.date}): $${d.totalCost} (AboveAvg: ${d.isAboveAverage})`));

    if (dailyRes.status !== 200 || dailyData.data.dailyBreakdown.length !== 5) {
      throw new Error('Daily budget breakdown failed!');
    }
    console.log('✅ Daily budget breakdown PASSED');

    // ----------------------------------------------------
    // TEST 4: GET /api/v1/trips/:tripId/budget/insights
    // ----------------------------------------------------
    console.log('\n--- 4. Testing GET /api/v1/trips/:tripId/budget/insights ---');
    const insightsRes = await fetch(`${baseUrl}/trips/${tripId}/budget/insights`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const insightsData = await insightsRes.json();
    console.log(`Insights Status: ${insightsRes.status}`);
    console.log('Smart Recommendations:', insightsData.data.insights);

    if (insightsRes.status !== 200 || !Array.isArray(insightsData.data.insights) || insightsData.data.insights.length === 0) {
      throw new Error('Smart insights generation failed!');
    }
    console.log('✅ Smart budget insights PASSED');

    // ----------------------------------------------------
    // TEST 5: GET /api/v1/trips/:tripId/budget/health
    // ----------------------------------------------------
    console.log('\n--- 5. Testing GET /api/v1/trips/:tripId/budget/health ---');
    const healthRes = await fetch(`${baseUrl}/trips/${tripId}/budget/health`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const healthData = await healthRes.json();
    console.log(`Health Score Status: ${healthRes.status}`);
    console.log('Health Payload:', JSON.stringify(healthData.data, null, 2));

    if (healthRes.status !== 200 || typeof healthData.data.score !== 'number') {
      throw new Error('Trip health score evaluation failed!');
    }
    console.log('✅ Trip health score evaluation PASSED');

    // ----------------------------------------------------
    // TEST 6: PATCH Expense & Verify OVER_BUDGET status
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Expense Update & OVER_BUDGET Status ---');
    const patchRes = await fetch(`${baseUrl}/trips/${tripId}/expenses/${expense1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        amount: 300, // Was 150, now 300 -> Total becomes 1075 (Exceeds $1000 budget)
      }),
    });
    console.log(`Patch Status: ${patchRes.status}`);

    const newOverviewRes = await fetch(`${baseUrl}/trips/${tripId}/budget`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const newOverviewData = await newOverviewRes.json();
    console.log(`Updated Total: $${newOverviewData.data.totalCost}, Status: ${newOverviewData.data.status}, OverBudget: ${newOverviewData.data.isOverBudget}`);

    if (newOverviewData.data.status !== 'OVER_BUDGET' || !newOverviewData.data.isOverBudget) {
      throw new Error('OVER_BUDGET status check after expense increase failed!');
    }
    console.log('✅ OVER_BUDGET detection PASSED');

    // ----------------------------------------------------
    // TEST 7: DELETE Expense
    // ----------------------------------------------------
    console.log('\n--- 7. Testing DELETE Expense ---');
    const delRes = await fetch(`${baseUrl}/trips/${tripId}/expenses/${expense1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`Delete Status: ${delRes.status}`);

    const finalOverviewRes = await fetch(`${baseUrl}/trips/${tripId}/budget`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const finalOverviewData = await finalOverviewRes.json();
    console.log(`Final Recalculated Total: $${finalOverviewData.data.totalCost}`);

    if (finalOverviewData.data.totalCost !== 775) {
      throw new Error('Expense deletion recalculation failed!');
    }
    console.log('✅ Expense deletion & recalculation PASSED');

    // Cleanup
    await prisma.trip.delete({ where: { id: tripId } });
    await prisma.user.delete({ where: { id: ownerUser.id } });
    console.log('\n🧹 Test trip and user cleaned up.');

    console.log('\n🎉 ALL VOYAGEIQ SMART BUDGET ENGINE TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Budget Engine Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testBudgetModule();
