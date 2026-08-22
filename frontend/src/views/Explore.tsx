import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockDestinations } from '../data/mockData';
import { DestinationCard } from '../components/DestinationCard';
import { Button } from '../components/ui/Button';
import { Search, Compass, X, Calendar, Star, Info, Plus, ArrowUpDown } from 'lucide-react';
import type { DestinationSuggestion } from '../data/mockData';

const bestForMap: Record<string, string[]> = {
  'Kyoto, Japan': ['Culture', 'Food', 'Nature'],
  'Amalfi Coast, Italy': ['Coastal', 'Food', 'Culture'],
  'Swiss Alps, Switzerland': ['Nature', 'Adventure'],
  'Reykjavik, Iceland': ['Adventure', 'Nature'],
  'New York City, USA': ['Urban', 'Shopping', 'Food', 'Culture'],
};

const popularActivitiesMap: Record<string, string[]> = {
  'Kyoto, Japan': [
    'Walk through the thousands of vermilion torii gates at Fushimi Inari-taisha.',
    'Explore the towering stalks in the Arashiyama Bamboo Grove.',
    'Visit the iconic Golden Pavilion (Kinkaku-ji) reflecting on the mirror pond.',
    'Join a guided walking tour of the historic Gion geisha district.'
  ],
  'Amalfi Coast, Italy': [
    'Take a scenic boat cruise along Positano and Amalfi vertical cliffs.',
    'Wander the lush cliffside gardens of Villa Rufolo in Ravello.',
    'Hike the famous Path of the Gods (Sentiero degli Dei) trail.',
    'Enjoy local limoncello tasting at a vertical lemon orchard.'
  ],
  'Swiss Alps, Switzerland': [
    'Ride the spectacular Glacier Express panoramic train.',
    'Ski or snowboard the majestic slopes surrounding Zermatt and Matterhorn.',
    'Ascend to the "Top of Europe" at the Jungfraujoch high-altitude station.',
    'Paraglide over the alpine meadows of Interlaken.'
  ],
  'Reykjavik, Iceland': [
    'Soak in the geothermal healing waters of the world-famous Blue Lagoon.',
    'Hike the Golden Circle routes (Gullfoss, Geysir, and Thingvellir National Park).',
    'Embark on an off-road super jeep safari chasing the Northern Lights.',
    'Explore the inside of a natural crystal ice cave under Vatnajökull.'
  ],
  'New York City, USA': [
    'Bicycle through Central Park and picnic near Bethesda Fountain.',
    'Catch a award-winning musical spectacle on Broadway.',
    'Watch the sunset from the top observation deck of the Empire State Building.',
    'Explore world-class exhibitions at the Metropolitan Museum of Art.'
  ],
};

const regionMap: Record<string, string> = {
  'Kyoto, Japan': 'Asia',
  'Amalfi Coast, Italy': 'Europe',
  'Swiss Alps, Switzerland': 'Europe',
  'Reykjavik, Iceland': 'Europe',
  'New York City, USA': 'North America',
};

const budgetStyleMap: Record<string, 'Budget' | 'Balanced' | 'Luxury'> = {
  'Kyoto, Japan': 'Balanced',
  'Amalfi Coast, Italy': 'Luxury',
  'Swiss Alps, Switzerland': 'Luxury',
  'Reykjavik, Iceland': 'Balanced',
  'New York City, USA': 'Luxury',
};

export const Explore: React.FC = () => {
  const { trips, addCityToTrip, addTrip, setActiveTripId, setCurrentView, showToast } = useApp();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [budgetStyleFilter, setBudgetStyleFilter] = useState('All');
  const [costIndexFilter, setCostIndexFilter] = useState('All');
  const [minRatingFilter, setMinRatingFilter] = useState('All');
  const [styleFilter, setStyleFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'cheapest' | 'recommended' | 'alphabetical'>('popular');

  // Modal views state
  const [selectedDestForModal, setSelectedDestForModal] = useState<DestinationSuggestion | null>(null);
  const [selectedDestForAdd, setSelectedDestForAdd] = useState<DestinationSuggestion | null>(null);

  // Add stop form state
  const [selectedTripId, setSelectedTripId] = useState('');
  const [newTripName, setNewTripName] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  // Extract unique countries
  const countries = ['All', ...Array.from(new Set(mockDestinations.map(d => d.name.split(', ')[1])))];

  // Process data
  const filteredDestinations = mockDestinations
    .filter((dest) => {
      const countryName = dest.name.split(', ')[1] || '';
      const regionName = regionMap[dest.name] || 'Europe';
      const budgetStyle = budgetStyleMap[dest.name] || 'Balanced';
      const costIndex = dest.dailyBudgetEstimate <= 150 ? '$$' : dest.dailyBudgetEstimate <= 230 ? '$$$' : '$$$$';
      const bestFor = bestForMap[dest.name] || [];

      // 1. Text Search
      const matchesSearch =
        dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dest.tagline.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Country Filter
      const matchesCountry = countryFilter === 'All' || countryName === countryFilter;

      // 3. Region Filter
      const matchesRegion = regionFilter === 'All' || regionName === regionFilter;

      // 4. Budget Style Filter
      const matchesBudgetStyle = budgetStyleFilter === 'All' || budgetStyle === budgetStyleFilter;

      // 5. Cost Index Filter
      const matchesCostIndex = costIndexFilter === 'All' || costIndex === costIndexFilter;

      // 6. Rating Filter
      const matchesRating =
        minRatingFilter === 'All' ||
        dest.rating >= Number(minRatingFilter);

      // 7. Travel Style Filter
      const matchesStyle = styleFilter === 'All' || bestFor.includes(styleFilter);

      return (
        matchesSearch &&
        matchesCountry &&
        matchesRegion &&
        matchesBudgetStyle &&
        matchesCostIndex &&
        matchesRating &&
        matchesStyle
      );
    })
    .sort((a, b) => {
      if (sortBy === 'cheapest') {
        return a.dailyBudgetEstimate - b.dailyBudgetEstimate;
      } else if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'recommended') {
        // Recommend by rating first, then budget
        return b.rating - a.rating;
      } else {
        // popular (default)
        return b.rating - a.rating;
      }
    });

  // Actions
  const handleOpenAddStop = (dest: DestinationSuggestion) => {
    setSelectedDestForAdd(dest);
    
    // Auto-select first trip if exists
    if (trips.length > 0) {
      setSelectedTripId(trips[0].id);
      setArrivalDate(trips[0].startDate);
      setDepartureDate(trips[0].endDate);
    } else {
      setSelectedTripId('NEW');
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      const endWeek = new Date();
      endWeek.setDate(nextMonth.getDate() + 7);
      
      setArrivalDate(nextMonth.toISOString().split('T')[0]);
      setDepartureDate(endWeek.toISOString().split('T')[0]);
    }
  };

  const handleTripSelectionChange = (tripId: string) => {
    setSelectedTripId(tripId);
    if (tripId === 'NEW') {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      const endWeek = new Date();
      endWeek.setDate(nextMonth.getDate() + 7);
      
      setArrivalDate(nextMonth.toISOString().split('T')[0]);
      setDepartureDate(endWeek.toISOString().split('T')[0]);
    } else {
      const targetTrip = trips.find(t => t.id === tripId);
      if (targetTrip) {
        setArrivalDate(targetTrip.startDate);
        setDepartureDate(targetTrip.endDate);
      }
    }
  };

  const handleConfirmAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestForAdd) return;

    let targetTripId = selectedTripId;

    // Validate date bounds
    if (new Date(arrivalDate) > new Date(departureDate)) {
      showToast('Departure date cannot be before arrival date.', 'error');
      return;
    }

    if (selectedTripId === 'NEW') {
      if (!newTripName.trim()) {
        showToast('Please enter a trip name.', 'error');
        return;
      }
      
      // Scaffold a new trip
      targetTripId = addTrip({
        name: newTripName,
        description: `Expedition highlighting ${selectedDestForAdd.name}`,
        startDate: arrivalDate,
        endDate: departureDate,
        budgetLimit: 3000,
        destinations: [],
        collaborators: [],
        isShared: false,
        travelStyle: budgetStyleMap[selectedDestForAdd.name] || 'Balanced',
        currency: 'INR',
      });
      setActiveTripId(targetTripId);
    }

    // Add stop to trip
    addCityToTrip(targetTripId, {
      name: selectedDestForAdd.name,
      image: selectedDestForAdd.image,
      arrivalDate,
      departureDate,
    });

    // Automatically navigate to Itinerary Builder to show reflection
    setActiveTripId(targetTripId);
    setCurrentView('plan-trip');

    // Close overlays & cleanup
    setSelectedDestForAdd(null);
    setSelectedDestForModal(null);
    setNewTripName('');
    showToast(`Added ${selectedDestForAdd.name} stops to your travel route!`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Explore the World</h1>
          <p>Discover curated premium destinations that match your personal travel style.</p>
        </div>
      </div>

      {/* Discover Search Area */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Large search input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search cities, countries or destinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1.25rem 0.75rem 2.8rem',
              fontSize: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border 0.2s',
            }}
          />
          <Search
            size={18}
            color="var(--text-light)"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Filters Multi-row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Country filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Region filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Region</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="All">All Regions</option>
              <option value="Asia">Asia</option>
              <option value="Europe">Europe</option>
              <option value="North America">North America</option>
            </select>
          </div>

          {/* Budget filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Budget Style</label>
            <select
              value={budgetStyleFilter}
              onChange={(e) => setBudgetStyleFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="All">All Budgets</option>
              <option value="Budget">Budget</option>
              <option value="Balanced">Balanced</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          {/* Cost Index filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '110px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Cost Index</label>
            <select
              value={costIndexFilter}
              onChange={(e) => setCostIndexFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="All">All Ranges</option>
              <option value="$$">$$ (Economy)</option>
              <option value="$$$">$$$ (Mid-range)</option>
              <option value="$$$$">$$$$ (Premium)</option>
            </select>
          </div>

          {/* Rating filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '110px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Rating</label>
            <select
              value={minRatingFilter}
              onChange={(e) => setMinRatingFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="All">Any Rating</option>
              <option value="4.7">4.7+ ⭐</option>
              <option value="4.8">4.8+ ⭐</option>
              <option value="4.9">4.9+ ⭐</option>
            </select>
          </div>

          {/* Travel style filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Travel Style</label>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="All">All Styles</option>
              <option value="Culture">Culture</option>
              <option value="Food">Food</option>
              <option value="Nature">Nature</option>
              <option value="Adventure">Adventure</option>
              <option value="Shopping">Shopping</option>
              <option value="Coastal">Coastal</option>
              <option value="Urban">Urban</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUpDown size={11} /> Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '0.45rem 0.6rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="popular">Popular</option>
              <option value="cheapest">Cheapest</option>
              <option value="recommended">Recommended</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

        </div>

        {/* Clear Filters indicator */}
        {(searchTerm || countryFilter !== 'All' || regionFilter !== 'All' || budgetStyleFilter !== 'All' || costIndexFilter !== 'All' || minRatingFilter !== 'All' || styleFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setCountryFilter('All');
              setRegionFilter('All');
              setBudgetStyleFilter('All');
              setCostIndexFilter('All');
              setMinRatingFilter('All');
              setStyleFilter('All');
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

      {/* Destinations Grid Gallery */}
      {filteredDestinations.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredDestinations.map((dest) => (
            <DestinationCard
              key={dest.id}
              destination={dest}
              onViewDetails={setSelectedDestForModal}
              onAddToTrip={handleOpenAddStop}
            />
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
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>No destinations found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Try adjusting your filters or typing another search term.</p>
        </div>
      )}

      {/* 1. DETAIL MODAL */}
      {selectedDestForModal && (
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
          onClick={() => setSelectedDestForModal(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              animation: 'modal-scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image cover */}
            <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
              <img
                src={selectedDestForModal.image}
                alt={selectedDestForModal.name}
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
                onClick={() => setSelectedDestForModal(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0 }}>{selectedDestForModal.name}</h2>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Star size={11} fill="var(--color-accent-warm)" color="var(--color-accent-warm)" /> {selectedDestForModal.rating}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.875rem' }}>{selectedDestForModal.tagline}</p>
              </div>
            </div>

            {/* Scrollable details */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              
              {/* Description */}
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  About the destination
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                  {selectedDestForModal.description}
                </p>
              </div>

              {/* Grid properties */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', borderTop: '1px solid var(--border-color-light)', borderBottom: '1px solid var(--border-color-light)', padding: '1rem 0' }}>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Daily Estimate</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    ₹{(selectedDestForModal.dailyBudgetEstimate * 85).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Region</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {regionMap[selectedDestForModal.name] || 'Europe'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Best Period</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedDestForModal.bestSeason}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Average Weather</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedDestForModal.weatherTemp}
                  </span>
                </div>
              </div>

              {/* Popular Activities */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Popular Highlights & Activities
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(popularActivitiesMap[selectedDestForModal.name] || [
                    'Scenic walking tour through historical center.',
                    'Taste local seasonal foods and cultural workshops.',
                    'Guided nature hikes and peak photography excursions.'
                  ]).map((act, i) => (
                    <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {act}
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Footer triggers */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid var(--border-color-light)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <Button variant="outline" onClick={() => setSelectedDestForModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={() => handleOpenAddStop(selectedDestForModal)}
              >
                Add to Trip Itinerary
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* 2. ADD TO TRIP SELECTION MODAL */}
      {selectedDestForAdd && (
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
          onClick={() => setSelectedDestForAdd(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              animation: 'modal-scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Add Stop to Travel Route
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedDestForAdd.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedDestForAdd(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmAddStop} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Trip selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Select Trip</label>
                <select
                  value={selectedTripId}
                  onChange={(e) => handleTripSelectionChange(e.target.value)}
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
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.startDate.split('-')[0]})</option>
                  ))}
                  <option value="NEW">+ Create a new trip scaffolding</option>
                </select>
              </div>

              {/* Create new trip field if selected */}
              {selectedTripId === 'NEW' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} className="animate-fade-in">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>New Trip Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Asia Spring Break"
                    value={newTripName}
                    onChange={(e) => setNewTripName(e.target.value)}
                    required
                    style={{
                      padding: '0.55rem 0.8rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Date pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Calendar size={12} /> Arrival
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Calendar size={12} /> Departure
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
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

              {/* Information disclaimer */}
              {selectedTripId !== 'NEW' && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderLeft: '3px solid var(--color-primary)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    alignItems: 'flex-start',
                  }}
                >
                  <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>
                    The arrival date will default to the trip's start date ({trips.find(t => t.id === selectedTripId)?.startDate || ''}). You can modify this date to fit your multi-city sequence.
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button variant="outline" size="sm" onClick={() => setSelectedDestForAdd(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Confirm Add
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
