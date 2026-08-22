import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { mockDestinations } from '../data/mockData';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Calendar, MapPin, 
  DollarSign, Globe, Sparkles, ChevronLeft, ChevronRight, Users, Award, Plus, Calculator 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { trips, setCurrentView, setActiveTripId, addTrip, currentUser } = useApp();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Find the next upcoming trip (closest start date that is in the future)
  const nextTrip = [...trips]
    .filter((t) => new Date(t.startDate) >= new Date())
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  // SECTION 1 Stats Computations
  const upcomingCount = trips.filter(t => new Date(t.startDate) >= new Date()).length;
  const totalTrips = trips.length;
  
  // Distinct cities count
  const uniqueCities = new Set(trips.flatMap(t => t.destinations.map(d => d.name)));
  const citiesCount = uniqueCities.size;

  // Sum of budget limits
  const totalBudgetLimit = trips.reduce((sum, t) => sum + t.budgetLimit, 0);

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

  // Carousel scroll helpers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollOffset = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // SVG Circle Stroke calculation for 82% gauge
  const radius = 32;
  const circumference = 2 * Math.PI * radius; // ~201
  const strokeDashoffset = circumference - (82 / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '3rem' }}>
      
      {/* ==================== HERO BANNER SECTION ==================== */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-2xl)',
          backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          padding: '3rem 2.5rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(2, 132, 199, 0.35)', border: '1px solid rgba(2, 132, 199, 0.5)', fontSize: '0.75rem', fontWeight: 700, gap: '6px', alignItems: 'center' }}>
          <Sparkles size={12} color="var(--color-secondary)" /> Premium Intelligence
        </div>
        <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9 }}>
          Good morning, {currentUser.firstName} 👋
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: '1.15' }}>
          Where will you go next?
        </h1>
        <p style={{ opacity: 0.85, fontSize: '0.975rem', maxWidth: '580px', lineHeight: '1.5' }}>
          Plan smarter journeys, discover unforgettable places, and keep every detail in one place.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '0.75rem' }}>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setActiveTripId(null);
              setCurrentView('plan-trip');
            }}
          >
            Plan a New Trip
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentView('explore')}
            style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            Explore Destinations
          </Button>
          <Button
            variant="outline"
            leftIcon={<Calculator size={16} />}
            onClick={() => setCurrentView('cost-calculator')}
            style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            Cost Calculator
          </Button>
        </div>
      </div>

      {/* ==================== SECTION 1: TRAVEL OVERVIEW ==================== */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Your Travel Overview
        </h2>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.25rem'
          }}
          className="stats-row-grid"
        >
          <style>{`
            @media (max-width: 1024px) {
              .stats-row-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
            @media (max-width: 640px) {
              .stats-row-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          {/* Stat A */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color-light)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Calendar size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Upcoming Trips</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{upcomingCount}</span>
            </div>
          </div>

          {/* Stat B */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color-light)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-primary-hover)' }}>
              <Globe size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Trips</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalTrips}</span>
            </div>
          </div>

          {/* Stat C */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color-light)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
              <MapPin size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Cities Explored</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{citiesCount}</span>
            </div>
          </div>

          {/* Stat D */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color-light)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-accent-warm-light)', color: 'var(--color-accent-warm)' }}>
              <DollarSign size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Planned Budgets</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${totalBudgetLimit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SECTION 2: UPCOMING TRIP FEATURED CARD ==================== */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Upcoming Trip
        </h2>

        {nextTrip ? (
          (() => {
            const spent = nextTrip.destinations.reduce(
              (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
              0
            );
            const percent = Math.min(Math.round((spent / nextTrip.budgetLimit) * 100), 100);
            const isOver = spent > nextTrip.budgetLimit;

            return (
              <div
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-color-light)',
                }}
              >
                <style>{`
                  .trip-visual {
                    flex: 1;
                    min-width: 300px;
                    height: 280px;
                    position: relative;
                  }
                  .trip-details {
                    flex: 1.5;
                    min-width: 320px;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                  }
                  @media (max-width: 640px) {
                    .trip-visual { height: 180px !important; }
                    .trip-details { padding: 1.25rem !important; }
                  }
                `}</style>

                {/* Left side Visual image */}
                <div className="trip-visual">
                  <img
                    src={nextTrip.destinations[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800'}
                    alt={nextTrip.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.45))' }} />
                  
                  {/* Days countdown overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    Starts in {getDaysCountdown(nextTrip.startDate)} Days
                  </div>
                </div>

                {/* Right side details info */}
                <div className="trip-details">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {nextTrip.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={14} color="var(--text-light)" />
                      <span>{nextTrip.startDate} to {nextTrip.endDate}</span>
                    </div>
                  </div>

                  {/* Cities stops sequence */}
                  {nextTrip.destinations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Route:
                      </span>
                      {nextTrip.destinations.map((c, idx) => (
                        <React.Fragment key={c.id}>
                          {idx > 0 && <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>→</span>}
                          <Badge variant="neutral">{c.name}</Badge>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Budget analysis bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Budget Allocation</span>
                      <span style={{ color: isOver ? 'var(--color-error)' : 'var(--color-success)' }}>
                        ${spent.toLocaleString()} / ${nextTrip.budgetLimit.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          backgroundColor: isOver ? 'var(--color-error)' : percent > 85 ? 'var(--color-warning)' : 'var(--color-success)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer travelers & buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color-light)', paddingTop: '1rem', marginTop: 'auto' }}>
                    {/* Avatars */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {nextTrip.collaborators.length > 0 ? (
                        <div style={{ display: 'flex', marginRight: '6px' }}>
                          {nextTrip.collaborators.slice(0, 3).map((col, idx) => (
                            <img
                              key={idx}
                              src={col.avatar}
                              alt={col.name}
                              title={col.name}
                              style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid var(--bg-secondary)', marginLeft: idx > 0 ? '-8px' : 0, objectFit: 'cover' }}
                            />
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Users size={12} /> Personal Trip
                        </span>
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveTripId(nextTrip.id);
                        setCurrentView('trip-summary');
                      }}
                    >
                      View Trip
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            <Calendar size={32} style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '0.875rem' }}>No upcoming itineraries scheduled. Click plan a new trip to get started.</p>
          </div>
        )}
      </div>

      {/* ==================== SECTION 3: POPULAR DESTINATIONS (CAROUSEL) ==================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Popular Destinations
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Scaffold instant trips by selecting popular locations.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => scrollCarousel('left')}
              style={{ padding: '6px', borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              style={{ padding: '6px', borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          style={{
            display: 'flex',
            gap: '1.25rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none', // Firefox hidden
          }}
          className="carousel-container"
        >
          <style>{`
            .carousel-container::-webkit-scrollbar {
              display: none !important; /* Chrome/Safari hidden */
            }
            .carousel-card {
              flex: 0 0 300px;
              scroll-snap-align: start;
              background-color: var(--bg-secondary);
              border-radius: var(--radius-xl);
              border: 1px solid var(--border-color-light);
              overflow: hidden;
              display: flex;
              flex-direction: column;
              box-shadow: var(--shadow-sm);
              transition: all 0.3s ease;
            }
            .carousel-card:hover {
              transform: translateY(-4px);
              box-shadow: var(--shadow-lg);
            }
          `}</style>

          {mockDestinations.map((dest) => (
            <div key={dest.id} className="carousel-card">
              <div style={{ height: '175px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={dest.image}
                  alt={dest.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';
                  }}
                />

                {/* Gradient overlay for text readability */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(11,19,41,0.85))' }} />

                {/* Rating badge */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  ★ {dest.rating}
                </div>

                {/* City name + country ON the image */}
                <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', color: '#ffffff' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1.1 }}>
                    {dest.name.split(',')[0]}
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '1px', fontWeight: 500 }}>
                    {dest.name.split(',').slice(1).join(',').trim() || 'World Destination'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>DAILY BUDGET</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>${dest.dailyBudgetEstimate}/day</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleQuickPlan(dest.name)}
                  style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                >
                  Add to Trip
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== SECTION 4: YOUR RECENT TRIPS ==================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Your Recent Trips
          </h2>
          <button
            onClick={() => setCurrentView('my-trips')}
            style={{ fontSize: '0.825rem', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer' }}
          >
            View All
          </button>
        </div>

        <div className="grid-cols-3">
          {trips.slice(0, 3).map((trip) => {
            const spent = trip.destinations.reduce(
              (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
              0
            );
            
            const getStatusBadge = () => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const start = new Date(trip.startDate);
              const end = new Date(trip.endDate);

              if (today > end) return <Badge variant="neutral">Completed</Badge>;
              if (today >= start && today <= end) return <Badge variant="success">Active</Badge>;
              return <Badge variant="info">Upcoming</Badge>;
            };

            return (
              <div
                key={trip.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-color-light)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Photo cover */}
                <div style={{ height: '145px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={trip.destinations[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop'}
                    alt={trip.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,19,41,0.05) 0%, rgba(11,19,41,0.82) 100%)' }} />

                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    {getStatusBadge()}
                  </div>

                  {/* Trip name + place on image */}
                  <div style={{ position: 'absolute', bottom: '8px', left: '10px', right: '10px', color: '#fff' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                      {trip.name}
                    </div>
                    {trip.destinations.length > 0 && (
                      <div style={{ fontSize: '0.65rem', opacity: 0.85, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📍 {trip.destinations.map(d => d.name).join(' → ')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trip.name}
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {trip.startDate} to {trip.endDate}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color-light)', paddingTop: '0.5rem', marginTop: 'auto' }}>
                    <span>{trip.destinations.length} Stops</span>
                    <span>Budget: {spent > 0 ? `$${spent.toLocaleString()}/` : ''}${trip.budgetLimit.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveTripId(trip.id);
                        setCurrentView('plan-trip');
                      }}
                      style={{ flex: 1, padding: '4px 0', fontSize: '0.75rem' }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setActiveTripId(trip.id);
                        setCurrentView('trip-summary');
                      }}
                      style={{ flex: 1, padding: '4px 0', fontSize: '0.75rem' }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== SECTION 5: SMART TRAVEL INSIGHT ==================== */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Smart Travel Insight
        </h2>

        <div
          className="glass-panel animate-fade-in"
          style={{
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '1.5rem 2rem',
            border: '1px solid var(--border-color-light)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success-light)',
                color: 'var(--color-success)',
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <Award size={26} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Budget Optimizer Insight
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                Your next trip is currently **82%** within your planned budget limits. You have managed your transportation and activity slots efficiently.
              </p>
            </div>
          </div>

          {/* Radial Circular SVG Gauge Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
              <svg width="74" height="74" viewBox="0 0 74 74" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="37"
                  cy="37"
                  r={radius}
                  fill="transparent"
                  stroke="var(--border-color-light)"
                  strokeWidth="6"
                />
                {/* Active Colored Arc */}
                <circle
                  cx="37"
                  cy="37"
                  r={radius}
                  fill="transparent"
                  stroke="var(--color-success)"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              {/* Inner Text label */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                82%
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ color: 'var(--color-success)' }}>★ Optimal Score</span>
              <span>+$180 Saved Est</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
