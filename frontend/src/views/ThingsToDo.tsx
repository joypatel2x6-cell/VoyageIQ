import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Search, Compass, X, Calendar, Star, Info, Plus, Clock, MapPin } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  city: string;
  cost: number;
  durationHours: number;
  rating: number;
  category: 'sightseeing' | 'food' | 'adventure' | 'culture' | 'shopping' | 'entertainment' | 'nature';
  location: string;
  description: string;
  image: string;
  recommendedTime: string; // e.g. "10:00"
}

const mockActivities: ActivityItem[] = [
  // Paris
  {
    id: 'act-p1',
    title: 'Eiffel Tower Summit Skip-the-Line Tour',
    city: 'Paris, France',
    cost: 1800,
    durationHours: 2,
    rating: 4.8,
    category: 'sightseeing',
    location: 'Champ de Mars, 5 Avenue Anatole France',
    description: 'Bypass the notoriously long lines and ascend to the absolute summit of the Eiffel Tower with an expert guide, taking in panoramic sweeps of Paris.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '10:00',
  },
  {
    id: 'act-p2',
    title: 'Louvre Museum Masterpieces Guided Tour',
    city: 'Paris, France',
    cost: 2200,
    durationHours: 3,
    rating: 4.7,
    category: 'culture',
    location: 'Rue de Rivoli, 75001 Paris',
    description: 'Explore the worlds largest art museum with a licensed art historian guide. Visit the Mona Lisa, Venus de Milo, and Winged Victory of Samothrace without getting lost.',
    image: 'https://images.unsplash.com/photo-1543242594-c8bae8b9e728?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '14:30',
  },
  {
    id: 'act-p3',
    title: 'Seine River Romantic Dinner Cruise',
    city: 'Paris, France',
    cost: 4500,
    durationHours: 2.5,
    rating: 4.6,
    category: 'food',
    location: 'Port de la Bourdonnais (Eiffel Tower foot)',
    description: 'Float past illuminated iconic landmarks like Notre-Dame and the Louvre while savoring a gourmet 3-course French dinner accompanied by fine wine and live music.',
    image: 'https://images.unsplash.com/photo-1513581105804-763d1b6a7ecf?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '20:00',
  },
  {
    id: 'act-p4',
    title: 'Montmartre Artists & Sacré-Cœur Walking Walk',
    city: 'Paris, France',
    cost: 0,
    durationHours: 2,
    rating: 4.8,
    category: 'culture',
    location: 'Place du Tertre, Montmartre',
    description: 'Stroll the cobblestone streets of Paris\' bohemian quarter. See where Picasso and Van Gogh painted, and enjoy panoramic views from the Sacré-Cœur Basilica steps.',
    image: 'https://images.unsplash.com/photo-1509840144524-a67b3c638d97?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '16:00',
  },
  {
    id: 'act-p5',
    title: 'Disneyland Paris Magic Ticket',
    city: 'Paris, France',
    cost: 7500,
    durationHours: 10,
    rating: 4.9,
    category: 'entertainment',
    location: 'Marne-la-Vallée, 77777',
    description: 'Spend a thrilling day at Disneyland Park and Walt Disney Studios. Experience fairy-tale castles, interactive rides, and colorful parades for all ages.',
    image: 'https://images.unsplash.com/photo-1544040762-796e8302b29f?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '09:00',
  },
  {
    id: 'act-p6',
    title: 'Catacombs of Paris Guided Exploration',
    city: 'Paris, France',
    cost: 2500,
    durationHours: 1.5,
    rating: 4.5,
    category: 'adventure',
    location: '1 Avenue du Colonel Henri Rol-Tanguy',
    description: 'Descend 20 meters underground to tour the historic ossuary containing the remains of over six million Parisians. Learn about the city\'s subterranean tunnel history.',
    image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '11:00',
  },

  // Kyoto
  {
    id: 'act-k1',
    title: 'Traditional Tea Ceremony in Gion District',
    city: 'Kyoto, Japan',
    cost: 3000,
    durationHours: 1.5,
    rating: 4.9,
    category: 'culture',
    location: 'Gion Machi, Higashiyama Ward, Kyoto',
    description: 'Learn the highly stylized rituals of preparing and consuming powdered matcha tea in a serene wooden tea house guided by a licensed master practitioner.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '11:00',
  },
  {
    id: 'act-k2',
    title: 'Fushimi Inari Torii Gate Hiking Tour',
    city: 'Kyoto, Japan',
    cost: 0,
    durationHours: 3,
    rating: 4.9,
    category: 'adventure',
    location: '68 Fukusa Yabunouchicho, Fushimi Ward',
    description: 'Hike the scenic paths winding up Mount Inari under thousands of vibrant red torii gates. Explore hidden forest shrines and capture stunning vistas over Kyoto.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '07:30',
  },
  {
    id: 'act-k3',
    title: 'Kyoto Hidden Street Food Crawl',
    city: 'Kyoto, Japan',
    cost: 3800,
    durationHours: 2.5,
    rating: 4.7,
    category: 'food',
    location: 'Nishiki Market / Pontocho Alley',
    description: 'Taste authentic local delicacies like skewered wagyu, fresh yuba (tofu skin), Kyoto-style sushi, and sweet dango dumplings in historic culinary markets.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '18:00',
  },

  // Swiss Alps
  {
    id: 'act-s1',
    title: 'Jungfraujoch Top of Europe Rail Pass',
    city: 'Swiss Alps, Switzerland',
    cost: 18000,
    durationHours: 8,
    rating: 4.9,
    category: 'sightseeing',
    location: 'Interlaken / Lauterbrunnen Station',
    description: 'Take the spectacular historic cogwheel train climbing through tunnels inside the Eiger peak to reach Europe\'s highest altitude railway station at 3,454m.',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '08:30',
  },
  {
    id: 'act-s2',
    title: 'Tandem Paragliding Over Interlaken Meadows',
    city: 'Swiss Alps, Switzerland',
    cost: 14000,
    durationHours: 1.5,
    rating: 4.9,
    category: 'adventure',
    location: 'Höhematte Landing Field, Interlaken',
    description: 'Soar like a bird high above Interlaken and its emerald lakes. Enjoy spectacular panoramic sweeps of the Eiger, Mönch, and Jungfrau peaks with a certified tandem pilot.',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '10:00',
  },

  // Reykjavik
  {
    id: 'act-r1',
    title: 'Blue Lagoon Premium Geothermal Bathing',
    city: 'Reykjavik, Iceland',
    cost: 7800,
    durationHours: 3,
    rating: 4.7,
    category: 'nature',
    location: 'Norðurljósavegur 9, Grindavík',
    description: 'Soothe your muscles in the mineral-rich geothermal waters of the Blue Lagoon. Package includes silica mud masks, dynamic cave steam baths, and a swim-up bar drink.',
    image: 'https://images.unsplash.com/photo-1504829857797-ddff28127792?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '15:00',
  },
  {
    id: 'act-r2',
    title: 'Northern Lights Expedition Cruise',
    city: 'Reykjavik, Iceland',
    cost: 5000,
    durationHours: 4,
    rating: 4.8,
    category: 'nature',
    location: 'Reykjavik Old Harbour, Ægisgarður 5',
    description: 'Cruise away from the city light pollution into the dark bay. Learn about aurora science while waiting for the cosmic green waves to light up the night sky.',
    image: 'https://images.unsplash.com/photo-1524311546418-5100966f2a0b?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '21:00',
  },

  // New York City
  {
    id: 'act-n1',
    title: 'Broadway Musical Ticket: The Lion King',
    city: 'New York City, USA',
    cost: 9800,
    durationHours: 2.5,
    rating: 4.9,
    category: 'entertainment',
    location: 'Minskoff Theatre, 200 W 45th St',
    description: 'Experience Julie Taymor\'s stage masterpiece at the Minskoff. Marvel at the award-winning puppetry, gorgeous costumes, and iconic music by Elton John.',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '19:00',
  },
  {
    id: 'act-n2',
    title: 'Chelsea Market & High Line Gastronomy Crawl',
    city: 'New York City, USA',
    cost: 4200,
    durationHours: 3,
    rating: 4.6,
    category: 'food',
    location: '75 9th Ave, New York, NY 10011',
    description: 'Explore the culinary histories of the Meatpacking District. Walk along the elevated High Line railroad park and sample local artisanal taco, dessert, and cheese bites.',
    image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?q=80&w=800&auto=format&fit=crop',
    recommendedTime: '12:00',
  }
];

const categoryLabels: Record<string, string> = {
  sightseeing: 'Sightseeing',
  food: 'Food & Dining',
  adventure: 'Adventure',
  culture: 'Culture & Arts',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  nature: 'Nature & Parks',
};

const categoryColors: Record<string, string> = {
  sightseeing: '#10b981', // emerald
  food: '#f43f5e',        // rose
  adventure: '#f97316',   // orange
  culture: '#8b5cf6',     // purple
  shopping: '#ec4899',    // pink
  entertainment: '#6d28d9', // violet
  nature: '#22c55e',      // green
};

export const ThingsToDo: React.FC = () => {
  const { trips, addActivity, showToast } = useApp();

  // Selected City Scope
  const [selectedCity, setSelectedCity] = useState('Paris, France');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [costFilter, setCostFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');

  // Modal Views
  const [selectedActForModal, setSelectedActForModal] = useState<ActivityItem | null>(null);
  const [selectedActForAdd, setSelectedActForAdd] = useState<ActivityItem | null>(null);

  // Form State
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [activityTime, setActivityTime] = useState('');

  // Cities List
  const cities = ['Paris, France', 'Kyoto, Japan', 'Amalfi Coast, Italy', 'Swiss Alps, Switzerland', 'Reykjavik, Iceland', 'New York City, USA'];
  const categories = ['All', 'Sightseeing', 'Food', 'Adventure', 'Culture', 'Shopping', 'Entertainment', 'Nature'];

  // Process data
  const filteredActivities = mockActivities
    .filter((act) => {
      // 1. City selection scope
      if (act.city !== selectedCity) return false;

      // 2. Text Search
      const matchesSearch =
        act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.location.toLowerCase().includes(searchTerm.toLowerCase());

      // 3. Category Filter
      const matchesCategory =
        activeCategory === 'All' ||
        act.category.toLowerCase() === activeCategory.toLowerCase();

      // 4. Cost Filter
      let matchesCost = true;
      if (costFilter === 'Free') matchesCost = act.cost === 0;
      else if (costFilter === 'Budget') matchesCost = act.cost > 0 && act.cost <= 2500;
      else if (costFilter === 'Mid') matchesCost = act.cost > 2500 && act.cost <= 6000;
      else if (costFilter === 'Premium') matchesCost = act.cost > 6000;

      // 5. Duration Filter
      let matchesDuration = true;
      if (durationFilter === 'short') matchesDuration = act.durationHours <= 2;
      else if (durationFilter === 'medium') matchesDuration = act.durationHours > 2 && act.durationHours <= 4;
      else if (durationFilter === 'long') matchesDuration = act.durationHours > 4;

      // 6. Rating Filter
      const matchesRating =
        ratingFilter === 'All' ||
        act.rating >= Number(ratingFilter);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCost &&
        matchesDuration &&
        matchesRating
      );
    });

  // Action methods
  const handleOpenAddActivity = (act: ActivityItem) => {
    setSelectedActForAdd(act);

    // Filter trips that contain this city as a stop, or default to all trips
    const matchingTrips = trips.filter(t => 
      t.destinations.some(d => d.name.toLowerCase().includes(act.city.split(',')[0].toLowerCase()))
    );

    const activeList = matchingTrips.length > 0 ? matchingTrips : trips;

    if (activeList.length > 0) {
      const defaultTrip = activeList[0];
      setSelectedTripId(defaultTrip.id);
      
      const defaultCity = defaultTrip.destinations.find(d => 
        d.name.toLowerCase().includes(act.city.split(',')[0].toLowerCase())
      ) || defaultTrip.destinations[0];

      if (defaultCity) {
        setSelectedCityId(defaultCity.id);
        setActivityDate(defaultCity.arrivalDate);
      } else {
        setSelectedCityId('');
        setActivityDate(defaultTrip.startDate);
      }
      setActivityTime(act.recommendedTime);
    } else {
      setSelectedTripId('');
      setSelectedCityId('');
      setActivityDate('');
      setActivityTime(act.recommendedTime);
    }
  };

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    const targetTrip = trips.find(t => t.id === tripId);
    if (targetTrip) {
      const defaultCity = targetTrip.destinations.find(d => 
        selectedActForAdd && d.name.toLowerCase().includes(selectedActForAdd.city.split(',')[0].toLowerCase())
      ) || targetTrip.destinations[0];

      if (defaultCity) {
        setSelectedCityId(defaultCity.id);
        setActivityDate(defaultCity.arrivalDate);
      } else {
        setSelectedCityId('');
        setActivityDate(targetTrip.startDate);
      }
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const targetTrip = trips.find(t => t.id === selectedTripId);
    if (targetTrip) {
      const targetCity = targetTrip.destinations.find(d => d.id === cityId);
      if (targetCity) {
        setActivityDate(targetCity.arrivalDate);
      }
    }
  };

  const handleConfirmAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActForAdd) return;

    if (!selectedTripId || !selectedCityId) {
      showToast(`Please create a trip stop for ${selectedActForAdd.city.split(',')[0]} before adding activities!`, 'error');
      return;
    }

    // Verify date bounds
    const targetTrip = trips.find(t => t.id === selectedTripId);
    const targetCity = targetTrip?.destinations.find(d => d.id === selectedCityId);

    if (targetCity) {
      const actDate = new Date(activityDate);
      const arrDate = new Date(targetCity.arrivalDate);
      const depDate = new Date(targetCity.departureDate);

      if (actDate < arrDate || actDate > depDate) {
        showToast(`Activity date must fall within stop dates: ${targetCity.arrivalDate} to ${targetCity.departureDate}`, 'error');
        return;
      }
    }

    // Call addActivity context CRUD
    addActivity(selectedTripId, selectedCityId, {
      title: selectedActForAdd.title,
      cost: selectedActForAdd.cost,
      date: activityDate,
      time: activityTime,
      category: selectedActForAdd.category as any,
      location: selectedActForAdd.location,
      notes: `Suggested activity from VoyageIQ Explore. Price: ₹${selectedActForAdd.cost.toLocaleString()}/person.`,
    });

    // Cleanup
    setSelectedActForAdd(null);
    setSelectedActForModal(null);
    showToast('Activity added to your itinerary.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Discover Things To Do</h1>
          <p>Explore high-rated excursions, dining tours, and cultural sights mapped to active destinations.</p>
        </div>
      </div>

      {/* Segmented City Tabs Selection */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color-light)',
        }}
      >
        {cities.map((city) => {
          const isActive = selectedCity === city;
          return (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '0.5rem 1rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Filters Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Search bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder={`Search activities in ${selectedCity.split(',')[0]}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.5rem',
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <Search
            size={16}
            color="var(--text-light)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Filter selectors row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>Category</label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              style={{
                padding: '0.4rem 0.5rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Cost limits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>Cost Limit</label>
            <select
              value={costFilter}
              onChange={(e) => setCostFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.5rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="All">All Prices</option>
              <option value="Free">Free / Complimentary</option>
              <option value="Budget">Under ₹2,500</option>
              <option value="Mid">₹2,500 to ₹6,000</option>
              <option value="Premium">Premium (₹6,000+)</option>
            </select>
          </div>

          {/* Duration limits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>Duration</label>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.5rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="All">All Durations</option>
              <option value="short">Under 2 hours</option>
              <option value="medium">2 to 4 hours</option>
              <option value="long">Half-day / Full-day (4h+)</option>
            </select>
          </div>

          {/* Ratings limits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '110px' }}>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>Rating</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.5rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="All">Any Reviews</option>
              <option value="4.6">4.6+ ⭐</option>
              <option value="4.7">4.7+ ⭐</option>
              <option value="4.8">4.8+ ⭐</option>
            </select>
          </div>

        </div>

        {/* Clear Filters indicator */}
        {(searchTerm || activeCategory !== 'All' || costFilter !== 'All' || durationFilter !== 'All' || ratingFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveCategory('All');
              setCostFilter('All');
              setDurationFilter('All');
              setRatingFilter('All');
            }}
            style={{
              alignSelf: 'flex-end',
              fontSize: '0.75rem',
              color: 'var(--color-primary)',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid List rendering */}
      {filteredActivities.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color-light)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.25s ease',
              }}
              className="card-hover"
            >
              {/* Cover Photo */}
              <div style={{ position: 'relative', width: '100%', paddingTop: '56%', overflow: 'hidden' }}>
                <img
                  src={act.image}
                  alt={act.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* Category badge */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      backgroundColor: categoryColors[act.category] || '#64748b',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {categoryLabels[act.category]}
                  </span>
                </div>

                {/* Rating badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    color: 'var(--text-on-dark)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    zIndex: 2,
                  }}
                >
                  <Star size={11} fill="var(--color-accent-warm)" color="var(--color-accent-warm)" />
                  {act.rating}
                </div>
              </div>

              {/* Information body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: '1.3' }}>
                    {act.title}
                  </h3>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <MapPin size={11} /> {act.location.split(',')[0]}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45', flex: 1, margin: 0 }}>
                  {act.description}
                </p>

                {/* Metas Row: Duration, Time */}
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                    <Clock size={12} /> {act.durationHours} hours
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                    Rec. Time: {act.recommendedTime}
                  </span>
                </div>

                {/* Pricing & Triggers row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color-light)',
                    marginTop: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 500 }}>Price Target</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {act.cost === 0 ? 'Complimentary' : `₹${act.cost.toLocaleString()}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedActForModal(act)}
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAddActivity(act)}
                      leftIcon={<Plus size={12} />}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Add Stop
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            border: '1px dashed var(--border-color-light)',
          }}
        >
          <Compass size={36} color="var(--text-light)" />
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>No activities found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Try clearing filters or checking another category.</p>
        </div>
      )}

      {/* 1. VIEW DETAIL MODAL */}
      {selectedActForModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(11, 19, 41, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedActForModal(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modal-scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image header */}
            <div style={{ position: 'relative', height: '220px' }}>
              <img
                src={selectedActForModal.image}
                alt={selectedActForModal.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.8))',
                }}
              />
              <button
                onClick={() => setSelectedActForModal(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>

              <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', color: '#ffffff' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: categoryColors[selectedActForModal.category] || '#64748b',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '6px',
                  }}
                >
                  {categoryLabels[selectedActForModal.category]}
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{selectedActForModal.title}</h2>
              </div>
            </div>

            {/* Scrollable details */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Full Description
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {selectedActForModal.description}
                </p>
              </div>

              {/* Meta stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', borderTop: '1px solid var(--border-color-light)', borderBottom: '1px solid var(--border-color-light)', padding: '1rem 0' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>Price Person</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedActForModal.cost === 0 ? 'Free' : `₹${selectedActForModal.cost.toLocaleString()}`}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>Duration</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={13} /> {selectedActForModal.durationHours} hours
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>Rec. Time Slot</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedActForModal.recommendedTime}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>Rating Reviews</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Star size={12} fill="var(--color-accent-warm)" color="var(--color-accent-warm)" /> {selectedActForModal.rating}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Excursion Location</span>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedActForModal.location}</span>
              </div>
            </div>

            {/* Modal actions */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color-light)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <Button variant="outline" onClick={() => setSelectedActForModal(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={() => handleOpenAddActivity(selectedActForModal)}
              >
                Add to Itinerary
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* 2. ADD TO TRIP ACTIVITY MODAL */}
      {selectedActForAdd && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(11, 19, 41, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedActForAdd(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              animation: 'modal-scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Add to Active Itinerary
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedActForAdd.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedActForAdd(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAddActivity} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Select Trip */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Select Trip</label>
                <select
                  value={selectedTripId}
                  onChange={(e) => handleTripChange(e.target.value)}
                  required
                  style={{
                    padding: '0.55rem 0.8rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>-- Select Active Trip --</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.startDate.split('-')[0]})</option>
                  ))}
                </select>
              </div>

              {/* Select Stop City */}
              {selectedTripId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} className="animate-fade-in">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Select Stop City</label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    required
                    style={{
                      padding: '0.55rem 0.8rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled>-- Select Stop Destination --</option>
                    {trips.find(t => t.id === selectedTripId)?.destinations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Time selection */}
              {selectedTripId && selectedCityId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="animate-fade-in">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={12} /> Schedule Date
                    </label>
                    <input
                      type="date"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      required
                      min={trips.find(t => t.id === selectedTripId)?.destinations.find(d => d.id === selectedCityId)?.arrivalDate}
                      max={trips.find(t => t.id === selectedTripId)?.destinations.find(d => d.id === selectedCityId)?.departureDate}
                      style={{
                        padding: '0.5rem 0.6rem',
                        fontSize: '0.825rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} /> Time Slot
                    </label>
                    <input
                      type="time"
                      value={activityTime}
                      onChange={(e) => setActivityTime(e.target.value)}
                      required
                      style={{
                        padding: '0.5rem 0.6rem',
                        fontSize: '0.825rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              {selectedTripId && selectedCityId && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderLeft: '3px solid var(--color-primary)',
                    fontSize: '0.725rem',
                    color: 'var(--text-secondary)',
                    alignItems: 'flex-start',
                  }}
                >
                  <Info size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>
                    Scheduling bounds for this city stop are: {trips.find(t => t.id === selectedTripId)?.destinations.find(d => d.id === selectedCityId)?.arrivalDate} to {trips.find(t => t.id === selectedTripId)?.destinations.find(d => d.id === selectedCityId)?.departureDate}.
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button variant="outline" size="sm" onClick={() => setSelectedActForAdd(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Add to Itinerary
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
