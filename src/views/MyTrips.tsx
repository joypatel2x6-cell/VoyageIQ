import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TripCard } from '../components/TripCard';
import { Button } from '../components/ui/Button';
import { Search, Plus, Map, Filter, ArrowUpDown } from 'lucide-react';

export const MyTrips: React.FC = () => {
  const { trips, deleteTrip, setActiveTripId, setCurrentView } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'budget'>('date');

  const getTripStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today > end) return 'completed';
    if (today >= start && today <= end) return 'active';
    return 'upcoming';
  };

  // Filter and Sort trips
  const processedTrips = trips
    .filter((trip) => {
      const matchesSearch =
        trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destinations.some((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const status = getTripStatus(trip.startDate, trip.endDate);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'budget') {
        return b.budgetLimit - a.budgetLimit;
      } else {
        // Sort by start date ascending
        return a.startDate.localeCompare(b.startDate);
      }
    });

  const handleCreateNewTrip = () => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>My Travel Itineraries</h1>
          <p>Organize, customize, and keep track of your multi-city journeys.</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={handleCreateNewTrip}
        >
          Plan New Trip
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search trips by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem 0.5rem 2.2rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              transition: 'border 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '0.45rem 1.75rem 0.45rem 0.75rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Trips</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active Now</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Sorting selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={14} /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '0.45rem 1.75rem 0.45rem 0.75rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="date">Start Date</option>
            <option value="budget">Budget Limit</option>
          </select>
        </div>
      </div>

      {/* Trips Grid list */}
      {processedTrips.length > 0 ? (
        <div className="grid-cols-3">
          {processedTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onView={handleViewSummary}
              onDelete={deleteTrip}
              onEdit={handleEditTrip}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-secondary)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-light)',
            }}
          >
            <Map size={32} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              No itineraries found
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
              We couldn't find any trips matching your filters. Reset search, or design a new travel route from scratch.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleCreateNewTrip}>
              Create Trip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
