import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TripCard } from '../components/TripCard';
import { Button } from '../components/ui/Button';
import { Search, Plus, MapPin, ArrowUpDown, Calendar, DollarSign } from 'lucide-react';

export const MyTrips: React.FC = () => {
  const { trips, deleteTrip, setActiveTripId, setCurrentView, cloneTrip } = useApp();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'budget' | 'duration'>('newest');

  const getDuration = (trip: any) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const getTripCategory = (trip: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (today > end) return 'completed';
    if (today >= start && today <= end) return 'ongoing';
    return 'upcoming';
  };

  // Filter and Sort trips
  const processedTrips = trips
    .filter((trip) => {
      // 1. Search title & description
      const matchesSearch =
        trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Destination/Stop filter
      const matchesDest =
        !destFilter.trim() ||
        trip.destinations.some((d) => d.name.toLowerCase().includes(destFilter.toLowerCase()));

      // 3. Date bounds filter
      const matchesDate =
        !dateFilter ||
        (new Date(dateFilter) >= new Date(trip.startDate) &&
         new Date(dateFilter) <= new Date(trip.endDate));

      // 4. Budget filter
      const matchesBudget =
        !budgetFilter || trip.budgetLimit <= Number(budgetFilter);

      return matchesSearch && matchesDest && matchesDate && matchesBudget;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return b.startDate.localeCompare(a.startDate);
      } else if (sortBy === 'oldest') {
        return a.startDate.localeCompare(b.startDate);
      } else if (sortBy === 'budget') {
        return b.budgetLimit - a.budgetLimit;
      } else {
        return getDuration(b) - getDuration(a);
      }
    });

  // Categorize
  const ongoingTrips = processedTrips.filter((t) => getTripCategory(t) === 'ongoing');
  const upcomingTrips = processedTrips.filter((t) => getTripCategory(t) === 'upcoming');
  const completedTrips = processedTrips.filter((t) => getTripCategory(t) === 'completed');

  const handleCreateNewTrip = () => {
    setActiveTripId(null); // start fresh
    setCurrentView('plan-trip');
  };

  const handleViewSummary = (id: string) => {
    setActiveTripId(id);
    setCurrentView('trip-summary');
  };

  const handleEditTrip = (id: string) => {
    setActiveTripId(id);
    setCurrentView('plan-trip');
  };

  const renderEmptyState = () => (
    <div
      className="glass-panel"
      style={{
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--bg-secondary)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        border: '1px dashed var(--border-color-light)',
        width: '100%',
        margin: '0.5rem 0 1rem',
      }}
    >
      <span style={{ fontSize: '1.75rem' }}>✈️</span>
      <div>
        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          No trips here yet.
        </h4>
        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Start planning your next adventure.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Plus size={14} />}
        onClick={handleCreateNewTrip}
        style={{ marginTop: '0.25rem' }}
      >
        Plan a New Trip
      </Button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      {/* Top Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>My Trips</h1>
          <p>Organize, plan, and review all of your multi-city travel itineraries.</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={handleCreateNewTrip}
        >
          Plan a New Trip
        </Button>
      </div>

      {/* Advanced Filters Block */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid var(--border-color-light)',
        }}
      >
        {/* Search row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Text search */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search your trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.2rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <Search
              size={15}
              color="var(--text-light)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          {/* Destination filter */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Filter by stop/city..."
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.2rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <MapPin
              size={15}
              color="var(--text-light)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        {/* Date, Budget & Sort row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Date bounds */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', flex: 1 }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> Active Date
            </span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                flex: 1,
                padding: '0.4rem 0.6rem',
                fontSize: '0.825rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Budget cap slider / input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', flex: 1 }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={13} /> Max Budget
            </span>
            <input
              type="number"
              placeholder="Budget Limit"
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              style={{
                flex: 1,
                padding: '0.4rem 0.6rem',
                fontSize: '0.825rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Sort selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px', flex: 1 }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={13} /> Sort By
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                flex: 1,
                padding: '0.45rem 0.6rem',
                fontSize: '0.825rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="budget">Budget Limit</option>
              <option value="duration">Trip Duration</option>
            </select>
          </div>
        </div>

        {/* Filters Clear Button */}
        {(searchTerm || destFilter || dateFilter || budgetFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setDestFilter('');
              setDateFilter('');
              setBudgetFilter('');
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
            Clear All Filters
          </button>
        )}
      </div>

      {/* TRIP CATEGORIES SECTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* SECTION 1: Ongoing Trips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Ongoing Trips
            </h2>
            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 700 }}>
              {ongoingTrips.length}
            </span>
          </div>

          {ongoingTrips.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {ongoingTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onView={handleViewSummary}
                  onDelete={deleteTrip}
                  onEdit={handleEditTrip}
                  onDuplicate={cloneTrip}
                />
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>

        {/* SECTION 2: Upcoming Trips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Upcoming Trips
            </h2>
            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 700 }}>
              {upcomingTrips.length}
            </span>
          </div>

          {upcomingTrips.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {upcomingTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onView={handleViewSummary}
                  onDelete={deleteTrip}
                  onEdit={handleEditTrip}
                  onDuplicate={cloneTrip}
                />
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>

        {/* SECTION 3: Completed Trips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Completed Trips
            </h2>
            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontWeight: 700 }}>
              {completedTrips.length}
            </span>
          </div>

          {completedTrips.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {completedTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onView={handleViewSummary}
                  onDelete={deleteTrip}
                  onEdit={handleEditTrip}
                  onDuplicate={cloneTrip}
                />
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>

      </div>
    </div>
  );
};
