import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockDestinations } from '../data/mockData';
import { DestinationCard } from '../components/DestinationCard';
import { Search, Compass } from 'lucide-react';

type CategoryFilter = 'All' | 'Culture' | 'Nature' | 'Adventure' | 'Coastal' | 'Urban';

export const Explore: React.FC = () => {
  const { addTrip, setActiveTripId, setCurrentView } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');

  const categories: CategoryFilter[] = ['All', 'Culture', 'Nature', 'Adventure', 'Coastal', 'Urban'];

  const filteredDestinations = mockDestinations.filter((dest) => {
    const matchesSearch =
      dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.tagline.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = activeCategory === 'All' || dest.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleQuickPlan = (destinationName: string) => {
    // Scaffold a trip and transition to Plan Trip
    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() + 30);
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultStart.getDate() + 7);

    const formattedStart = defaultStart.toISOString().split('T')[0];
    const formattedEnd = defaultEnd.toISOString().split('T')[0];

    const tripId = addTrip({
      name: `Expedition to ${destinationName}`,
      description: `Explore the local sites, foods, and experiences in ${destinationName}.`,
      startDate: formattedStart,
      endDate: formattedEnd,
      budgetLimit: 3000,
      destinations: [],
      collaborators: [],
      isShared: false,
    });

    setActiveTripId(tripId);
    setCurrentView('plan-trip');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Discover Getaways</h1>
          <p>Hand-picked premium travel spots. Tap plan to scaffold an instant itinerary.</p>
        </div>
      </div>

      {/* Filter Category & Search Row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.4rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: activeCategory === cat ? 'transparent' : 'var(--border-color-light)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search destination highlights, activities, seasons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.5rem',
              fontSize: '0.925rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              transition: 'border 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>
      </div>

      {/* Grid gallery */}
      {filteredDestinations.length > 0 ? (
        <div className="grid-cols-3">
          {filteredDestinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} onAddTrip={handleQuickPlan} />
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
          }}
        >
          <Compass size={36} />
          <p style={{ fontSize: '0.9rem' }}>We couldn't find any destinations matching your search.</p>
        </div>
      )}
    </div>
  );
};
