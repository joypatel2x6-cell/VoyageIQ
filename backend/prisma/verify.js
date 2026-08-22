const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Starting Database Relationship Verification...');

  // 1. Count records across all models
  const counts = {
    users: await prisma.user.count(),
    trips: await prisma.trip.count(),
    cities: await prisma.city.count(),
    tripStops: await prisma.tripStop.count(),
    activities: await prisma.activity.count(),
    tripActivities: await prisma.tripActivity.count(),
    expenses: await prisma.expense.count(),
    savedDestinations: await prisma.savedDestination.count(),
    communityPosts: await prisma.communityPost.count(),
    comments: await prisma.comment.count(),
    likes: await prisma.like.count(),
    notifications: await prisma.notification.count(),
  };

  console.log('📊 Table Record Counts:', JSON.stringify(counts, null, 2));

  // 2. Deep relational query: User -> Trips -> Stops -> City & TripActivities -> Activity
  const fullUserTrip = await prisma.user.findFirst({
    where: { email: 'john.doe@example.com' },
    include: {
      trips: {
        include: {
          tripStops: {
            include: {
              city: true,
              tripActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
          expenses: true,
        },
      },
      savedDestinations: {
        include: {
          city: true,
        },
      },
    },
  });

  console.log(`✅ User ${fullUserTrip.firstName} ${fullUserTrip.lastName} retrieved.`);
  console.log(`   - Trips count: ${fullUserTrip.trips.length}`);
  const firstTrip = fullUserTrip.trips[0];
  console.log(`   - Trip Name: "${firstTrip.name}", Budget: ${firstTrip.budget} ${firstTrip.currency}`);
  console.log(`   - Trip Stops count: ${firstTrip.tripStops.length}`);
  console.log(`   - Trip Expenses count: ${firstTrip.expenses.length}`);
  console.log(`   - Saved Destinations count: ${fullUserTrip.savedDestinations.length}`);

  // 3. Community Post with User, Comments, Likes
  const post = await prisma.communityPost.findFirst({
    include: {
      user: true,
      trip: true,
      comments: {
        include: { user: true },
      },
      likes: {
        include: { user: true },
      },
    },
  });

  console.log(`✅ Community Post by ${post.user.firstName}: "${post.content.substring(0, 40)}..."`);
  console.log(`   - Linked Trip: ${post.trip ? post.trip.name : 'None'}`);
  console.log(`   - Comments count: ${post.comments.length} (First comment by ${post.comments[0]?.user.firstName})`);
  console.log(`   - Likes count: ${post.likes.length}`);

  // 4. Test unique constraint on Like (duplicate prevention)
  try {
    await prisma.like.create({
      data: {
        userId: post.likes[0].userId,
        communityPostId: post.id,
      },
    });
    console.error('❌ FAIL: Duplicate like was created!');
  } catch (err) {
    console.log('✅ Duplicate Like constraint verified successfully (caught expected constraint error).');
  }

  // 5. Test unique constraint on SavedDestination
  const savedDest = await prisma.savedDestination.findFirst();
  try {
    await prisma.savedDestination.create({
      data: {
        userId: savedDest.userId,
        cityId: savedDest.cityId,
      },
    });
    console.error('❌ FAIL: Duplicate saved destination was created!');
  } catch (err) {
    console.log('✅ Duplicate SavedDestination constraint verified successfully (caught expected constraint error).');
  }

  console.log('🎉 All Database Relationships and Constraints Verified Successfully!');
}

verify()
  .catch((err) => {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
