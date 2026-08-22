export interface Activity {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  cost: number;
  category: 'sightseeing' | 'food' | 'adventure' | 'culture' | 'shopping' | 'entertainment' | 'transport' | 'other' | 'accommodation' | 'activity';
  location: string;
  notes?: string;
}

export interface CityDestination {
  id: string;
  name: string;
  image: string;
  arrivalDate: string; // YYYY-MM-DD
  departureDate: string; // YYYY-MM-DD
  activities: Activity[];
}

export interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  budgetLimit: number;
  destinations: CityDestination[];
  isShared: boolean;
  likesCount: number;
  commentsCount: number;
  collaborators: {
    name: string;
    avatar: string;
  }[];
  travelStyle?: 'Budget' | 'Balanced' | 'Luxury';
  currency?: string;
  travelersCount?: number;
  coverImage?: string;
}

export interface DestinationSuggestion {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  rating: number;
  category: 'Culture' | 'Nature' | 'Adventure' | 'Coastal' | 'Urban';
  bestSeason: string;
  weatherTemp: string;
  dailyBudgetEstimate: number;
}

export interface CommunityPost {
  id: string;
  trip: Trip;
  authorName: string;
  authorAvatar: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
}

export const mockDestinations: DestinationSuggestion[] = [
  {
    id: 'dest-1',
    name: 'Kyoto, Japan',
    tagline: 'Tradition meets breathtaking seasonal beauty',
    description: 'Explore ancient wooden temples, colorful shrines, historic geisha districts, and serene bamboo forests in Japan\'s cultural heart.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    category: 'Culture',
    bestSeason: 'Spring (Cherry Blossoms) & Autumn',
    weatherTemp: '18°C / 64°F',
    dailyBudgetEstimate: 140
  },
  {
    id: 'dest-2',
    name: 'Amalfi Coast, Italy',
    tagline: 'Charming vertical towns overlooking sapphire waters',
    description: 'A dazzling stretch of Italian coastline where colored villages cling to sheer cliffs above the Mediterranean Sea.',
    image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    category: 'Coastal',
    bestSeason: 'May to September',
    weatherTemp: '26°C / 79°F',
    dailyBudgetEstimate: 220
  },
  {
    id: 'dest-3',
    name: 'Swiss Alps, Switzerland',
    tagline: 'Majestic peaks and crystal-clear lakes',
    description: 'A dream destination for skiers, hikers, and nature lovers seeking dramatic mountain vistas, neat chalet villages, and premium train journeys.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    category: 'Nature',
    bestSeason: 'December to March (Skiing), July to September (Hiking)',
    weatherTemp: '12°C / 54°F',
    dailyBudgetEstimate: 250
  },
  {
    id: 'dest-4',
    name: 'Reykjavik, Iceland',
    tagline: 'Vibrant city base for volcanic and polar wonders',
    description: 'Experience geothermal pools, towering waterfalls, active geysers, and the colorful dance of the Northern Lights.',
    image: 'https://images.unsplash.com/photo-1504829857797-ddff28127792?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    category: 'Adventure',
    bestSeason: 'June to August (Midnight Sun), November to February (Northern Lights)',
    weatherTemp: '4°C / 39°F',
    dailyBudgetEstimate: 190
  },
  {
    id: 'dest-5',
    name: 'New York City, USA',
    tagline: 'The concrete jungle where dreams are made',
    description: 'An iconic metropolis offering world-class museums, Broadway spectacles, bustling green spaces, and a culinary scene like no other.',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    category: 'Urban',
    bestSeason: 'Autumn (Sept-Nov) & Spring (April-June)',
    weatherTemp: '21°C / 70°F',
    dailyBudgetEstimate: 240
  }
];

export const mockTrips: Trip[] = [
  {
    id: 'trip-1',
    name: 'Autumn Escape to Japan',
    description: 'A premium journey through Japan\'s modern capital and traditional shrines during the breathtaking autumn foliage.',
    startDate: '2026-10-15',
    endDate: '2026-10-24',
    budgetLimit: 5000,
    isShared: true,
    likesCount: 142,
    commentsCount: 28,
    collaborators: [
      { name: 'Sarah Miller', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
      { name: 'Alex Wong', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
    ],
    destinations: [
      {
        id: 'city-1',
        name: 'Tokyo',
        image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop',
        arrivalDate: '2026-10-15',
        departureDate: '2026-10-19',
        activities: [
          {
            id: 'act-1',
            title: 'Welcome Dinner - Shinjuku Omoide Yokocho',
            date: '2026-10-15',
            time: '19:00',
            cost: 80,
            category: 'food',
            location: 'Omoide Yokocho, Tokyo',
            notes: 'Try the local grilled skewers and premium sake.'
          },
          {
            id: 'act-2',
            title: 'Luxury Hotel Stay - Park Hyatt Tokyo',
            date: '2026-10-15',
            time: '15:00',
            cost: 1600,
            category: 'accommodation',
            location: 'Nishi-Shinjuku, Tokyo',
            notes: '4 nights check-in.'
          },
          {
            id: 'act-3',
            title: 'Bullet Train Ticket to Tokyo',
            date: '2026-10-15',
            time: '11:00',
            cost: 130,
            category: 'transport',
            location: 'Haneda Airport (HND)',
            notes: 'Airport express and shinkansen pass.'
          },
          {
            id: 'act-4',
            title: 'TeamLab Planets Digital Art Exhibition',
            date: '2026-10-16',
            time: '10:00',
            cost: 35,
            category: 'activity',
            location: 'Toyosu, Tokyo',
            notes: 'Pre-booked tickets, prepare to walk barefoot.'
          },
          {
            id: 'act-5',
            title: 'Sushi Dinner at Ginza Onodera',
            date: '2026-10-17',
            time: '18:30',
            cost: 250,
            category: 'food',
            location: 'Ginza, Tokyo',
            notes: 'Fine dining sushi experience.'
          }
        ]
      },
      {
        id: 'city-2',
        name: 'Kyoto',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
        arrivalDate: '2026-10-19',
        departureDate: '2026-10-24',
        activities: [
          {
            id: 'act-6',
            title: 'Bullet Train - Tokyo to Kyoto',
            date: '2026-10-19',
            time: '09:00',
            cost: 120,
            category: 'transport',
            location: 'Tokyo Station',
            notes: 'Shinkansen Nozomi ride.'
          },
          {
            id: 'act-7',
            title: 'Traditional Ryokan Stay - Gion Hanamikoji',
            date: '2026-10-19',
            time: '14:00',
            cost: 1200,
            category: 'accommodation',
            location: 'Gion District, Kyoto',
            notes: '5 nights in authentic wooden townhouse with tatami mats.'
          },
          {
            id: 'act-8',
            title: 'Fushimi Inari Torii Gates Early Hike',
            date: '2026-10-20',
            time: '06:00',
            cost: 0,
            category: 'activity',
            location: 'Fushimi Inari Shrine',
            notes: 'Start early at sunrise to avoid crowds.'
          },
          {
            id: 'act-9',
            title: 'Arashiyama Bamboo Grove & Monkey Park',
            date: '2026-10-21',
            time: '13:00',
            cost: 15,
            category: 'activity',
            location: 'Arashiyama, Kyoto',
            notes: 'Bring cash for the monkey food and park entry.'
          },
          {
            id: 'act-10',
            title: 'Souvenirs Shopping (Matcha & Fans)',
            date: '2026-10-22',
            time: '15:00',
            cost: 120,
            category: 'shopping',
            location: 'Shijo-Dori Street',
            notes: 'Buy premium Uji matcha powder.'
          }
        ]
      }
    ]
  },
  {
    id: 'trip-2',
    name: 'Coastal Italian Romance',
    description: 'Basking in the golden Mediterranean sun, exploring cliffside roads and historic ruins on the Amalfi Coast.',
    startDate: '2026-09-02',
    endDate: '2026-09-09',
    budgetLimit: 4000,
    isShared: false,
    likesCount: 0,
    commentsCount: 0,
    collaborators: [],
    destinations: [
      {
        id: 'city-3',
        name: 'Amalfi',
        image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop',
        arrivalDate: '2026-09-02',
        departureDate: '2026-09-09',
        activities: [
          {
            id: 'act-11',
            title: 'Boutique Hotel Stay - Santa Caterina',
            date: '2026-09-02',
            time: '14:00',
            cost: 2100,
            category: 'accommodation',
            location: 'Amalfi Town',
            notes: 'Spectacular cliff-edge ocean view suites.'
          },
          {
            id: 'act-12',
            title: 'Private Speedboat Tour - Positano & Capri',
            date: '2026-09-04',
            time: '10:00',
            cost: 650,
            category: 'activity',
            location: 'Amalfi Pier',
            notes: 'Includes drinks, snacks, snorkeling, and swim in the blue grotto.'
          },
          {
            id: 'act-13',
            title: 'Seafood Dinner - Da Gemma',
            date: '2026-09-05',
            time: '20:00',
            cost: 180,
            category: 'food',
            location: 'Amalfi Center',
            notes: 'Famous local restaurant, reservation confirmed.'
          }
        ]
      }
    ]
  }
];

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: 'post-1',
    authorName: 'Marcus Aurelius',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    likesCount: 342,
    commentsCount: 45,
    tags: ['Adventure', 'Nature', 'Iceland'],
    trip: {
      id: 'trip-c1',
      name: 'Icelandic Ring Road Expedition',
      description: 'The ultimate guide to traversing Iceland\'s Ring Road in 8 days. Waterfalls, hot springs, black sand beaches, and volcanic glaciers.',
      startDate: '2026-07-10',
      endDate: '2026-07-18',
      budgetLimit: 3000,
      isShared: true,
      likesCount: 342,
      commentsCount: 45,
      collaborators: [],
      destinations: [
        {
          id: 'city-c1-1',
          name: 'Golden Circle',
          image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
          arrivalDate: '2026-07-10',
          departureDate: '2026-07-12',
          activities: [
            {
              id: 'act-c1-1',
              title: 'Car Rental Pick-up (4x4 SUV)',
              date: '2026-07-10',
              time: '08:00',
              cost: 500,
              category: 'transport',
              location: 'Keflavik Airport',
              notes: 'Required for gravel F-roads.'
            },
            {
              id: 'act-c1-2',
              title: 'Snorkeling between Plates at Silfra',
              date: '2026-07-11',
              time: '11:00',
              cost: 150,
              category: 'activity',
              location: 'Thingvellir National Park',
              notes: 'Drysuit snorkeling in crystal clear glacial water.'
            }
          ]
        },
        {
          id: 'city-c1-2',
          name: 'Vatnajökull Glacier',
          image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop',
          arrivalDate: '2026-07-12',
          departureDate: '2026-07-15',
          activities: [
            {
              id: 'act-c1-3',
              title: 'Glacier Hiking Adventure',
              date: '2026-07-13',
              time: '10:00',
              cost: 120,
              category: 'activity',
              location: 'Skaftafell Reserve',
              notes: 'Crampons and ice axes provided.'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'post-2',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    likesCount: 228,
    commentsCount: 19,
    tags: ['Culture', 'Historic', 'Culinary'],
    trip: {
      id: 'trip-c2',
      name: '7-Day Cultural Heritage of Spain',
      description: 'Journey through Moorish castles, gothic cathedrals, historic tapas taverns, and vibrant flamenco shows in Madrid and Seville.',
      startDate: '2026-05-12',
      endDate: '2026-05-19',
      budgetLimit: 2500,
      isShared: true,
      likesCount: 228,
      commentsCount: 19,
      collaborators: [],
      destinations: [
        {
          id: 'city-c2-1',
          name: 'Seville',
          image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=800&auto=format&fit=crop',
          arrivalDate: '2026-05-12',
          departureDate: '2026-05-15',
          activities: [
            {
              id: 'act-c2-1',
              title: 'Alcázar of Seville Tour',
              date: '2026-05-13',
              time: '10:00',
              cost: 30,
              category: 'activity',
              location: 'Real Alcázar',
              notes: 'Stunning Moorish architecture. Book in advance.'
            },
            {
              id: 'act-c2-2',
              title: 'Flamenco Dinner Show',
              date: '2026-05-14',
              time: '20:30',
              cost: 75,
              category: 'food',
              location: 'Tablao Flamenco El Arenal',
              notes: 'Passionate performance and delicious Andalusian cuisine.'
            }
          ]
        }
      ]
    }
  }
];

export const mockInsights = [
  {
    id: 'ins-1',
    type: 'budget',
    title: 'Lodging Dominance in Japan',
    message: 'Accommodation takes up 56% of your budget. Consider swapping 1-2 nights at the Hyatt for a traditional Ryokan experience to save up to 40% on hotel taxes.',
    tripId: 'trip-1'
  },
  {
    id: 'ins-2',
    type: 'weather',
    title: 'Autumn Rain Warning in Kyoto',
    message: 'Late October gets an average of 4 rainy days. Pack a lightweight windbreaker and solid footwear for the Fushimi Inari hike.',
    tripId: 'trip-1'
  },
  {
    id: 'ins-3',
    type: 'price',
    title: 'Flight Deals to Tokyo',
    message: 'Smart Scanner detected flight pricing drops from San Francisco to Tokyo (NRT) by $145 for travel in mid-October. Ideal time to book.',
    tripId: 'trip-1'
  }
];
