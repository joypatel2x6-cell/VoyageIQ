const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testCommunityModule() {
  console.log('🧪 Starting VoyageIQ Community API Integration Tests...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const user1Email = `comm.author.${Date.now()}@example.com`;
  const user2Email = `comm.interactor.${Date.now()}@example.com`;

  let token1 = null;
  let user1 = null;
  let token2 = null;
  let user2 = null;
  let trip1Id = null;
  let postId = null;
  let commentId = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register User 1 & User 2, create Trip 1
    // ----------------------------------------------------
    console.log('\n--- SETUP: Creating test users and base trip ---');
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Sophia',
        lastName: 'Wanderer',
        email: user1Email,
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
        firstName: 'Lucas',
        lastName: 'Explorer',
        email: user2Email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    const reg2Data = await reg2Res.json();
    token2 = reg2Data.token;
    user2 = reg2Data.user;

    const tripRes = await fetch(`${baseUrl}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        name: 'Grand Italian Odyssey 2027',
        description: 'Exploring Rome, Florence, and Venice in 10 days.',
        startDate: '2027-12-01T00:00:00.000Z',
        endDate: '2027-12-10T00:00:00.000Z',
        budget: 2500,
        travelStyle: 'CULTURE',
      }),
    });
    const tripData = await tripRes.json();
    trip1Id = tripData.trip.id;

    // Add Stop in Rome
    const rome = await prisma.city.findFirst({ where: { name: 'Rome' } });
    if (rome) {
      await fetch(`${baseUrl}/trips/${trip1Id}/stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          cityId: rome.id,
          startDate: '2027-12-01T00:00:00.000Z',
          endDate: '2027-12-05T00:00:00.000Z',
          notes: 'Ancient Rome Exploration',
        }),
      });
    }

    // ----------------------------------------------------
    // TEST 1: POST /api/v1/community/posts (Publish Post)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Publish Community Post ---');
    const pubRes = await fetch(`${baseUrl}/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        tripId: trip1Id,
        content: 'Just finalized my 10-day Grand Italian Odyssey! Excited for authentic pizza and Roman ruins.',
      }),
    });
    const pubData = await pubRes.json();
    console.log(`Publish Status: ${pubRes.status}`);
    console.log('Post Body:', JSON.stringify(pubData.post, null, 2));

    if (pubRes.status !== 201 || !pubData.post.id || pubData.post.trip.isPublic !== true) {
      throw new Error('Publish community post failed or trip was not set to public!');
    }
    postId = pubData.post.id;
    console.log('✅ Publish community post PASSED');

    // ----------------------------------------------------
    // TEST 2: Authorization Check (User 2 publishing User 1 trip -> 403)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Unauthorized Trip Publish (403 Forbidden) ---');
    const unauthPubRes = await fetch(`${baseUrl}/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        tripId: trip1Id,
        content: 'Trying to steal and publish someone else trip!',
      }),
    });
    console.log(`Unauthorized Publish Status: ${unauthPubRes.status}`);
    if (unauthPubRes.status !== 403) {
      throw new Error('Unauthorized trip publish check failed!');
    }
    console.log('✅ Unauthorized publish check PASSED');

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/community/posts (Search & Filter)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing GET Community Feed (Search & Filter) ---');
    const feedRes = await fetch(`${baseUrl}/community/posts?search=Italian`);
    const feedData = await feedRes.json();
    console.log(`Feed Status: ${feedRes.status}, Found: ${feedData.data.length} posts`);
    if (feedRes.status !== 200 || feedData.data.length === 0) {
      throw new Error('GET community posts feed failed!');
    }
    console.log('✅ GET community feed PASSED');

    // ----------------------------------------------------
    // TEST 4: POST & DELETE /api/v1/community/posts/:postId/like
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Likes & Duplicate Prevention ---');
    // User 2 Likes Post
    const likeRes = await fetch(`${baseUrl}/community/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });
    const likeData = await likeRes.json();
    console.log(`Like Status: ${likeRes.status}, LikesCount: ${likeData.likesCount}, IsLikedByMe: ${likeData.isLikedByMe}`);
    if (likeRes.status !== 200 || likeData.likesCount !== 1 || !likeData.isLikedByMe) {
      throw new Error('Like post failed!');
    }

    // User 2 Likes Post AGAIN (Duplicate Prevention)
    const dupLikeRes = await fetch(`${baseUrl}/community/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });
    const dupLikeData = await dupLikeRes.json();
    console.log(`Duplicate Like Status: ${dupLikeRes.status}, LikesCount: ${dupLikeData.likesCount}`);
    if (dupLikeData.likesCount !== 1) {
      throw new Error('Duplicate like prevention failed!');
    }

    // User 2 Unlikes Post
    const unlikeRes = await fetch(`${baseUrl}/community/posts/${postId}/like`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    const unlikeData = await unlikeRes.json();
    console.log(`Unlike Status: ${unlikeRes.status}, LikesCount: ${unlikeData.likesCount}`);
    if (unlikeRes.status !== 200 || unlikeData.likesCount !== 0) {
      throw new Error('Unlike post failed!');
    }
    console.log('✅ Likes & Duplicate Prevention PASSED');

    // ----------------------------------------------------
    // TEST 5: Comments Flow
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Comments Flow ---');
    // Add Comment
    const addCommentRes = await fetch(`${baseUrl}/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        content: 'This itinerary looks magnificent! What hotel are you staying at in Rome?',
      }),
    });
    const addCommentData = await addCommentRes.json();
    console.log(`Add Comment Status: ${addCommentRes.status}`);
    if (addCommentRes.status !== 201 || !addCommentData.comment.id) {
      throw new Error('Add comment failed!');
    }
    commentId = addCommentData.comment.id;

    // Get Comments
    const getCommentsRes = await fetch(`${baseUrl}/community/posts/${postId}/comments`);
    const getCommentsData = await getCommentsRes.json();
    console.log(`Get Comments Status: ${getCommentsRes.status}, Comments Count: ${getCommentsData.comments.length}`);
    if (getCommentsRes.status !== 200 || getCommentsData.comments.length !== 1) {
      throw new Error('Get comments failed!');
    }

    // Delete Comment Authorization check (User 1 trying to delete User 2 comment -> 403)
    const unauthDelCommentRes = await fetch(`${baseUrl}/community/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    console.log(`Unauthorized Delete Comment Status: ${unauthDelCommentRes.status}`);
    if (unauthDelCommentRes.status !== 403) {
      throw new Error('Unauthorized comment deletion check failed!');
    }

    // Delete Comment as Author (User 2)
    const delCommentRes = await fetch(`${baseUrl}/community/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    console.log(`Delete Comment Status: ${delCommentRes.status}`);
    if (delCommentRes.status !== 200) {
      throw new Error('Delete comment failed!');
    }
    console.log('✅ Comments flow PASSED');

    // ----------------------------------------------------
    // TEST 6: PATCH & DELETE Community Post
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Post Update & Deletion ---');
    const updatePostRes = await fetch(`${baseUrl}/community/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        content: 'Updated post: Finalized Italy trip details with private transfers!',
      }),
    });
    const updatePostData = await updatePostRes.json();
    console.log(`Update Post Status: ${updatePostRes.status}`);
    if (updatePostRes.status !== 200 || !updatePostData.post.content.includes('Updated post')) {
      throw new Error('Update community post failed!');
    }

    const delPostRes = await fetch(`${baseUrl}/community/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    console.log(`Delete Post Status: ${delPostRes.status}`);
    if (delPostRes.status !== 200) {
      throw new Error('Delete community post failed!');
    }
    console.log('✅ Post Update & Deletion PASSED');

    // Cleanup
    await prisma.trip.delete({ where: { id: trip1Id } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });
    console.log('\n🧹 Test trips and users cleaned up.');

    console.log('\n🎉 ALL VOYAGEIQ COMMUNITY API TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Community API Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testCommunityModule();
