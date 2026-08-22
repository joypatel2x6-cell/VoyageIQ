import React from 'react';
import { useApp } from '../context/AppContext';
import { mockDestinations } from '../data/mockData';
import { DestinationCard } from '../components/DestinationCard';
import { BudgetProgress } from '../components/BudgetProgress';
import { Calendar, Compass, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const { trips, insights, setCurrentView, setActiveTripId, addTrip } = useApp();

  // Find the next upcoming trip (closest start date that is in the future)
  const nextTrip = [...trips]
    .filter((t) => new Date(t.startDate) >= new Date())
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  // Quick Stats
  const totalTrips = trips.length;
  const totalSpent = trips.reduce(
    (sum, t) =>
      sum +
      t.destinations.reduce((s, dest) => s + dest.activities.reduce((aSum, act) => aSum + act.cost, 0), 0),
    0
  );

  // Compute countdown in days
  const getDaysCountdown = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(dateStr);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleQuickPlan = (destinationName: string) => {
    // Scaffold a base trip and transition to Plan Trip
    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() + 30);
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultStart.getDate() + 7);

    const formattedStart = defaultStart.toISOString().split('T')[0];
    const formattedEnd = defaultEnd.toISOString().split('T')[0];

    const tripId = addTrip({
      name: `Adventure in ${destinationName}`,
      description: `A customized vacation through the beautiful sights of ${destinationName}.`,
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
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, var(--bg-dark-accent) 0%, var(--bg-dark-surface) 100%)',
          color: 'var(--text-on-dark)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        {/* Abstract background graphics */}
        <div style={{ position: 'absolute', right: '-10%', bottom: '-30%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)', opacity: 0.25, pointerEvents: 'none' }} />
        
        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            Welcome back, Emma!
          </h1>
          <p style={{ opacity: 0.8, fontSize: '0.95rem', maxWidth: '480px' }}>
            "Plan Smarter. Travel Further." Your customized hubs and travel metrics are all up to date.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Compass size={16} />}
              onClick={() => setCurrentView('explore')}
            >
              Explore Destinations
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('my-trips')}
              style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              View My Trips
            </Button>
          </div>
        </div>

        <div style={{ zIndex: 2, display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{totalTrips}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Trips Booked</span>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>
              ${totalSpent.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Spent So Far</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="dashboard-grid">
        <style>{`
          @media (min-width: 1024px) {
            .dashboard-grid {
              grid-template-columns: 2fr 1fr !important;
            }
          }
        `}</style>

        {/* Left Column: Spotlight & Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Next Trip Spotlight */}
          {nextTrip ? (
            <div
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color-light)', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Upcoming Spotlight</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                  In {getDaysCountdown(nextTrip.startDate)} Days
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <img
                  src={nextTrip.destinations[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800'}
                  alt={nextTrip.name}
                  style={{ width: '120px', height: '90px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{nextTrip.name}</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {nextTrip.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Starts: {nextTrip.startDate}</span>
                    <span>•</span>
                    <span>Destinations: {nextTrip.destinations.length}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActiveTripId(nextTrip.id);
                      setCurrentView('trip-summary');
                    }}
                    rightIcon={<ArrowRight size={14} />}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Calendar size={40} color="var(--text-light)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No upcoming trips planned</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                Start designing your next custom multi-city itinerary now with VoyageIQ.
              </p>
              <Button onClick={() => setCurrentView('plan-trip')} variant="primary" size="sm">
                Create Itinerary
              </Button>
            </div>
          )}

          {/* Recommendations Header */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Explore Curated Getaways</h2>
              <button
                onClick={() => setCurrentView('explore')}
                style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                See All <ArrowRight size={14} />
              </button>
            </div>
            {/* Grid display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {mockDestinations.slice(0, 2).map((dest) => (
                <DestinationCard key={dest.id} destination={dest} onAddTrip={handleQuickPlan} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Budgets & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Dynamic Budget Tracker */}
          {nextTrip ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Active Budget</h3>
              <BudgetProgress
                totalSpent={nextTrip.destinations.reduce(
                  (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
                  0
                )}
                budgetLimit={nextTrip.budgetLimit}
              />
            </div>
          ) : null}

          {/* Smart Travel Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Travel Alerts & Insights
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      padding: '6px',
                      borderRadius: '50%',
                      backgroundColor: ins.type === 'budget' ? 'var(--color-error-light)' : ins.type === 'price' ? 'var(--color-success-light)' : 'var(--color-accent-warm-light)',
                      display: 'flex',
                    }}
                  >
                    <AlertCircle
                      size={16}
                      color={ins.type === 'budget' ? 'var(--color-error)' : ins.type === 'price' ? 'var(--color-success)' : 'var(--color-accent-warm)'}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ins.title}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {ins.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
