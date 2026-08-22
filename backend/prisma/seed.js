const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting VoyageIQ Database Seeding...');

  // Clean existing database records safely in order of dependency
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.savedDestination.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.tripActivity.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Database cleaned.');

  // --------------------------------------------------------
  // 1. SEED USERS
  // --------------------------------------------------------
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const john = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+14155552671',
      passwordHash: defaultPasswordHash,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      city: 'San Francisco',
      country: 'United States',
      bio: 'Avid photographer and slow traveler exploring world cultures.',
      language: 'en',
    },
  });

  const sophia = await prisma.user.create({
    data: {
      firstName: 'Sophia',
      lastName: 'Chen',
      email: 'sophia.chen@example.com',
      phone: '+14155558832',
      passwordHash: defaultPasswordHash,
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
      city: 'Vancouver',
      country: 'Canada',
      bio: 'Culinary wanderer looking for local food markets and hidden coffee shops.',
      language: 'en',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@example.com',
      phone: '+442079460912',
      passwordHash: defaultPasswordHash,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      city: 'London',
      country: 'United Kingdom',
      bio: 'Solo backpacker and mountain hiker chasing sunrises worldwide.',
      language: 'en',
    },
  });

  console.log('✅ Created 3 sample users.');

  // --------------------------------------------------------
  // 2. SEED CITIES
  // --------------------------------------------------------
  const paris = await prisma.city.create({
    data: {
      name: 'Paris',
      country: 'France',
      region: 'Western Europe',
      description: 'The City of Light, famous for romantic boulevards, world-class art museums, and gourmet dining.',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000',
      costIndex: 85,
      popularity: 98,
      averageDailyCost: 180.00,
      latitude: 48.8566,
      longitude: 2.3522,
    },
  });

  const amsterdam = await prisma.city.create({
    data: {
      name: 'Amsterdam',
      country: 'Netherlands',
      region: 'Western Europe',
      description: 'Renowned for its elaborate canal network, historic narrow houses, and vibrant cycling culture.',
      image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&q=80&w=1000',
      costIndex: 80,
      popularity: 94,
      averageDailyCost: 160.00,
      latitude: 52.3676,
      longitude: 4.9041,
    },
  });

  const rome = await prisma.city.create({
    data: {
      name: 'Rome',
      country: 'Italy',
      region: 'Southern Europe',
      description: 'The Eternal City, home to ancient ruins like the Colosseum, Roman Forum, and Vatican City.',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=1000',
      costIndex: 75,
      popularity: 96,
      averageDailyCost: 150.00,
      latitude: 41.9028,
      longitude: 12.4964,
    },
  });

  const dubai = await prisma.city.create({
    data: {
      name: 'Dubai',
      country: 'United Arab Emirates',
      region: 'Middle East',
      description: 'A futuristic oasis known for luxury shopping, ultramodern architecture, and lively nightlife.',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1000',
      costIndex: 90,
      popularity: 95,
      averageDailyCost: 230.00,
      latitude: 25.2048,
      longitude: 55.2708,
    },
  });

  const tokyo = await prisma.city.create({
    data: {
      name: 'Tokyo',
      country: 'Japan',
      region: 'East Asia',
      description: 'A dazzling metropolis blending futuristic skyscrapers with historic temples and unmatched gastronomy.',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=1000',
      costIndex: 82,
      popularity: 99,
      averageDailyCost: 175.00,
      latitude: 35.6762,
      longitude: 139.6503,
    },
  });

  const zurich = await prisma.city.create({
    data: {
      name: 'Zurich',
      country: 'Switzerland',
      region: 'Central Europe',
      description: 'Nestled on Lake Zurich near the Alps, famous for picturesque old-town architecture and luxury chocolate.',
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=1000',
      costIndex: 95,
      popularity: 91,
      averageDailyCost: 260.00,
      latitude: 47.3769,
      longitude: 8.5417,
    },
  });

  console.log('✅ Created 6 major global cities.');

  // --------------------------------------------------------
  // 3. SEED ACTIVITIES
  // --------------------------------------------------------
  // Paris Activities
  const eiffelTower = await prisma.activity.create({
    data: {
      cityId: paris.id,
      name: 'Eiffel Tower Summit Access',
      category: 'SIGHTSEEING',
      description: 'Ascend to the top floor for panoramic views of Paris skyline.',
      image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&q=80&w=600',
      duration: 150,
      cost: 32.00,
      currency: 'USD',
      rating: 4.8,
      recommendedTime: 'Sunset',
    },
  });

  const louvreMuseum = await prisma.activity.create({
    data: {
      cityId: paris.id,
      name: 'Louvre Guided Art Tour',
      category: 'CULTURE',
      description: 'Explore masterworks including the Mona Lisa and Venus de Milo with an expert art historian.',
      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=600',
      duration: 180,
      cost: 25.00,
      currency: 'USD',
      rating: 4.9,
      recommendedTime: 'Morning',
    },
  });

  // Amsterdam Activities
  const canalCruise = await prisma.activity.create({
    data: {
      cityId: amsterdam.id,
      name: 'Luxury Open Boat Canal Cruise',
      category: 'SIGHTSEEING',
      description: 'Glide through Amsterdam historic UNESCO canal ring while enjoying local cheeses and drinks.',
      image: 'https://images.unsplash.com/photo-1584003564911-a7a321c84e1c?auto=format&fit=crop&q=80&w=600',
      duration: 75,
      cost: 28.00,
      currency: 'USD',
      rating: 4.7,
      recommendedTime: 'Late Afternoon',
    },
  });

  const vanGogh = await prisma.activity.create({
    data: {
      cityId: amsterdam.id,
      name: 'Van Gogh Museum Exhibition',
      category: 'CULTURE',
      description: 'Discover the world largest collection of paintings by Vincent van Gogh.',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600',
      duration: 120,
      cost: 24.00,
      currency: 'USD',
      rating: 4.8,
      recommendedTime: 'Morning',
    },
  });

  // Rome Activities
  const colosseumTour = await prisma.activity.create({
    data: {
      cityId: rome.id,
      name: 'Colosseum & Roman Forum Arena Tour',
      category: 'CULTURE',
      description: 'Walk on the gladiator arena floor and explore the underground chambers of ancient Rome.',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=600',
      duration: 180,
      cost: 45.00,
      currency: 'USD',
      rating: 4.9,
      recommendedTime: 'Early Morning',
    },
  });

  // Dubai Activities
  const desertSafari = await prisma.activity.create({
    data: {
      cityId: dubai.id,
      name: 'Red Dune Desert Safari & BBQ Dinner',
      category: 'ADVENTURE',
      description: 'Experience dune bashing, camel riding, quad biking, and a traditional Bedouin dinner show.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
      duration: 360,
      cost: 85.00,
      currency: 'USD',
      rating: 4.8,
      recommendedTime: 'Afternoon',
    },
  });

  // Tokyo Activities
  const shibuyaCrossing = await prisma.activity.create({
    data: {
      cityId: tokyo.id,
      name: 'Shibuya Sky & Scramble Crossing',
      category: 'SIGHTSEEING',
      description: 'Observe Tokyo famous scramble intersection from the 229m open-air rooftop observatory.',
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=600',
      duration: 90,
      cost: 18.00,
      currency: 'USD',
      rating: 4.9,
      recommendedTime: 'Night',
    },
  });

  const tsukijiFoodTour = await prisma.activity.create({
    data: {
      cityId: tokyo.id,
      name: 'Tsukiji Outer Market Food Tasting',
      category: 'FOOD',
      description: 'Savor fresh sashimi, tamagoyaki, and wagyu skewers with a local food guide.',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=600',
      duration: 150,
      cost: 65.00,
      currency: 'USD',
      rating: 4.9,
      recommendedTime: 'Morning',
    },
  });

  // Zurich Activities
  const lakeZurichCruise = await prisma.activity.create({
    data: {
      cityId: zurich.id,
      name: 'Lake Zurich Scenic Steamboat Tour',
      category: 'NATURE',
      description: 'Relax aboard a historic steamboat while enjoying panoramic views of Swiss villages and snowcapped peaks.',
      image: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&q=80&w=600',
      duration: 120,
      cost: 40.00,
      currency: 'USD',
      rating: 4.7,
      recommendedTime: 'Afternoon',
    },
  });

  console.log('✅ Created sample activities across all cities.');

  // --------------------------------------------------------
  // 4. SEED TRIPS & ITINERARIES
  // --------------------------------------------------------
  const euroTrip = await prisma.trip.create({
    data: {
      userId: john.id,
      name: 'European Grand Cultural Odyssey',
      description: 'A 10-day summer journey through romantic Paris, historic Amsterdam, and eternal Rome.',
      startDate: new Date('2026-06-10T00:00:00.000Z'),
      endDate: new Date('2026-06-20T00:00:00.000Z'),
      budget: 3500.00,
      currency: 'USD',
      travelers: 2,
      travelStyle: 'Culture & Fine Dining',
      coverImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=1000',
      isPublic: true,
      shareToken: 'euro-trip-john-2026',
      status: 'COMPLETED',
    },
  });

  const tokyoTrip = await prisma.trip.create({
    data: {
      userId: sophia.id,
      name: 'Tokyo Neon & Gastronomy Exploration',
      description: 'Immersing in ancient shrines, Michelin street food, and vibrant neon nightlife of Tokyo.',
      startDate: new Date('2026-10-05T00:00:00.000Z'),
      endDate: new Date('2026-10-14T00:00:00.000Z'),
      budget: 2800.00,
      currency: 'USD',
      travelers: 1,
      travelStyle: 'Solo Gastronomy & Tech',
      coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=1000',
      isPublic: true,
      shareToken: 'tokyo-sophia-2026',
      status: 'UPCOMING',
    },
  });

  const dubaiTrip = await prisma.trip.create({
    data: {
      userId: marcus.id,
      name: 'Dubai Oasis & Desert Adventure',
      description: 'Luxury high-rises meets desert sand dunes and Arabian gulf cruises.',
      startDate: new Date('2026-08-20T00:00:00.000Z'),
      endDate: new Date('2026-08-27T00:00:00.000Z'),
      budget: 3000.00,
      currency: 'USD',
      travelers: 2,
      travelStyle: 'Luxury & Adventure',
      coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1000',
      isPublic: false,
      status: 'ONGOING',
    },
  });

  console.log('✅ Created sample trips.');

  // --------------------------------------------------------
  // 5. SEED TRIP STOPS
  // --------------------------------------------------------
  const stopParis = await prisma.tripStop.create({
    data: {
      tripId: euroTrip.id,
      cityId: paris.id,
      startDate: new Date('2026-06-10T00:00:00.000Z'),
      endDate: new Date('2026-06-13T00:00:00.000Z'),
      orderIndex: 1,
      notes: 'Stay at Le Marais boutique hotel near Saint-Paul metro.',
    },
  });

  const stopAmsterdam = await prisma.tripStop.create({
    data: {
      tripId: euroTrip.id,
      cityId: amsterdam.id,
      startDate: new Date('2026-06-14T00:00:00.000Z'),
      endDate: new Date('2026-06-16T00:00:00.000Z'),
      orderIndex: 2,
      notes: 'Rent bicycles at Central Station for daily city commuting.',
    },
  });

  const stopRome = await prisma.tripStop.create({
    data: {
      tripId: euroTrip.id,
      cityId: rome.id,
      startDate: new Date('2026-06-17T00:00:00.000Z'),
      endDate: new Date('2026-06-20T00:00:00.000Z'),
      orderIndex: 3,
      notes: 'Stay in Trastevere district for authentic evening pasta.',
    },
  });

  const stopTokyo = await prisma.tripStop.create({
    data: {
      tripId: tokyoTrip.id,
      cityId: tokyo.id,
      startDate: new Date('2026-10-05T00:00:00.000Z'),
      endDate: new Date('2026-10-14T00:00:00.000Z'),
      orderIndex: 1,
      notes: 'Purchase Suica IC card at Narita Airport upon arrival.',
    },
  });

  console.log('✅ Created trip stops.');

  // --------------------------------------------------------
  // 6. SEED TRIP ACTIVITIES
  // --------------------------------------------------------
  await prisma.tripActivity.create({
    data: {
      tripStopId: stopParis.id,
      activityId: louvreMuseum.id,
      date: new Date('2026-06-11T00:00:00.000Z'),
      startTime: '09:30',
      duration: 180,
      cost: 25.00,
      notes: 'Timed entrance tickets pre-purchased.',
      orderIndex: 1,
    },
  });

  await prisma.tripActivity.create({
    data: {
      tripStopId: stopParis.id,
      activityId: eiffelTower.id,
      date: new Date('2026-06-12T00:00:00.000Z'),
      startTime: '19:00',
      duration: 150,
      cost: 32.00,
      notes: 'Watch the tower light sparkle show at 21:00.',
      orderIndex: 1,
    },
  });

  await prisma.tripActivity.create({
    data: {
      tripStopId: stopAmsterdam.id,
      activityId: canalCruise.id,
      date: new Date('2026-06-15T00:00:00.000Z'),
      startTime: '16:30',
      duration: 75,
      cost: 28.00,
      notes: 'Open bar and Dutch cheese board included.',
      orderIndex: 1,
    },
  });

  await prisma.tripActivity.create({
    data: {
      tripStopId: stopTokyo.id,
      activityId: tsukijiFoodTour.id,
      date: new Date('2026-10-06T00:00:00.000Z'),
      startTime: '08:00',
      duration: 150,
      cost: 65.00,
      notes: 'Meet local guide outside Tsukiji Hongwanji Temple.',
      orderIndex: 1,
    },
  });

  console.log('✅ Scheduled trip activities.');

  // --------------------------------------------------------
  // 7. SEED EXPENSES
  // --------------------------------------------------------
  await prisma.expense.create({
    data: {
      tripId: euroTrip.id,
      category: 'ACCOMMODATION',
      amount: 680.00,
      currency: 'USD',
      description: 'Hotel stay at Le Marais Paris (3 Nights)',
      date: new Date('2026-06-10T00:00:00.000Z'),
    },
  });

  await prisma.expense.create({
    data: {
      tripId: euroTrip.id,
      category: 'TRANSPORT',
      amount: 140.00,
      currency: 'USD',
      description: 'Eurostar High Speed Train Paris to Amsterdam',
      date: new Date('2026-06-14T00:00:00.000Z'),
    },
  });

  await prisma.expense.create({
    data: {
      tripId: euroTrip.id,
      category: 'FOOD',
      amount: 95.00,
      currency: 'USD',
      description: 'Dinner at Trattoria da Enzo in Rome',
      date: new Date('2026-06-18T00:00:00.000Z'),
    },
  });

  console.log('✅ Created trip expenses.');

  // --------------------------------------------------------
  // 8. SEED SAVED DESTINATIONS
  // --------------------------------------------------------
  await prisma.savedDestination.create({
    data: {
      userId: john.id,
      cityId: tokyo.id,
    },
  });

  await prisma.savedDestination.create({
    data: {
      userId: john.id,
      cityId: zurich.id,
    },
  });

  await prisma.savedDestination.create({
    data: {
      userId: sophia.id,
      cityId: paris.id,
    },
  });

  console.log('✅ Created saved destinations.');

  // --------------------------------------------------------
  // 9. SEED COMMUNITY POSTS, COMMENTS, LIKES
  // --------------------------------------------------------
  const post1 = await prisma.communityPost.create({
    data: {
      userId: john.id,
      tripId: euroTrip.id,
      content: 'Just wrapped up 10 incredible days in Paris, Amsterdam, and Rome! Pro tip: Pre-book the Louvre morning slot to beat the crowds.',
    },
  });

  const post2 = await prisma.communityPost.create({
    data: {
      userId: sophia.id,
      content: 'Planning my solo Tokyo itinerary for October! Any recommendations for authentic ramen spots in Shinjuku?',
    },
  });

  await prisma.comment.create({
    data: {
      userId: sophia.id,
      communityPostId: post1.id,
      content: 'Your photo at the Eiffel Tower summit is stunning! Adding the canal cruise to my bucket list.',
    },
  });

  await prisma.comment.create({
    data: {
      userId: marcus.id,
      communityPostId: post2.id,
      content: 'Check out Fuunji in Shinjuku for incredible tsukemen dip ramen. The queue moves fast!',
    },
  });

  await prisma.like.create({
    data: {
      userId: sophia.id,
      communityPostId: post1.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: marcus.id,
      communityPostId: post1.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: john.id,
      communityPostId: post2.id,
    },
  });

  console.log('✅ Created community posts, comments, and post likes.');

  // --------------------------------------------------------
  // 10. SEED NOTIFICATIONS
  // --------------------------------------------------------
  await prisma.notification.create({
    data: {
      userId: john.id,
      title: 'New Like on your Post',
      message: 'Sophia Chen liked your European Grand Cultural Odyssey post.',
      type: 'COMMUNITY_LIKE',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: sophia.id,
      title: 'Upcoming Trip Reminder',
      message: 'Your Tokyo trip starts in less than 2 months! Review your planned activities.',
      type: 'TRIP_REMINDER',
      isRead: true,
    },
  });

  console.log('✅ Created notifications.');
  console.log('🎉 VoyageIQ Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
