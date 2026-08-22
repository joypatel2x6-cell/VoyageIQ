import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Edit3, Calendar, MapPin, Share2, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TimelineItem } from '../components/TimelineItem';
import { BudgetCard } from '../components/BudgetCard';
import { Badge } from '../components/ui/Badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const TripSummary: React.FC = () => {
  const { trips, activeTripId, updateTrip, setCurrentView, showToast } = useApp();
  const activeTrip = trips.find((t) => t.id === activeTripId);
  const [activeTab, setActiveTab] = useState<'timeline' | 'budget'>('timeline');

  if (!activeTrip) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>No active trip selected.</p>
        <Button onClick={() => setCurrentView('my-trips')} size="sm">Go Back</Button>
      </div>
    );
  }

  // Budget calculations
  const totalCost = activeTrip.destinations.reduce(
    (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
    0
  );

  const isOverBudget = totalCost > activeTrip.budgetLimit;

  // Compile all activities sorted chronologically across all destinations
  const allActivities = activeTrip.destinations
    .flatMap((dest) => dest.activities)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

  // Calculate stats
  const totalDays = Math.ceil(
    (new Date(activeTrip.endDate).getTime() - new Date(activeTrip.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const totalStops = activeTrip.destinations.length;
  const totalActivities = allActivities.length;

  const getExpensesByCategory = () => {
    const categories: Record<string, number> = {
      accommodation: 0,
      transport: 0,
      food: 0,
      activity: 0,
      shopping: 0,
      other: 0,
    };
    allActivities.forEach((act) => {
      if (categories[act.category] !== undefined) {
        categories[act.category] += act.cost;
      } else {
        categories.other += act.cost;
      }
    });
    return categories;
  };

  const spentByCategory = getExpensesByCategory();

  // Recharts Config
  const chartData = Object.entries(spentByCategory).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: val,
  })).filter(item => item.value > 0);

  const COLORS = ['#8b5cf6', '#06b6d4', '#f43f5e', '#10b981', '#ec4899', '#64748b'];

  const toggleShareTrip = () => {
    updateTrip({
      ...activeTrip,
      isShared: !activeTrip.isShared,
    });
    showToast(
      activeTrip.isShared 
        ? `"${activeTrip.name}" is now removed from public feeds.` 
        : `"${activeTrip.name}" is shared with the VoyageIQ community!`,
      'success'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => setCurrentView('my-trips')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back to Trips
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShareTrip}
            leftIcon={<Share2 size={14} />}
          >
            {activeTrip.isShared ? 'Shared (Unpublish)' : 'Publish to Feed'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              showToast('Generating printable PDF itinerary...', 'info');
              setTimeout(() => {
                showToast('Itinerary PDF download started!', 'success');
              }, 1200);
            }}
            leftIcon={<Download size={14} />}
          >
            Download PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentView('plan-trip')}
            leftIcon={<Edit3 size={14} />}
          >
            Edit Trip
          </Button>
        </div>
      </div>

      {/* Hero Header Section */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
          <img
            src={activeTrip.destinations[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800'}
            alt={activeTrip.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(11, 19, 41, 0.1), rgba(11, 19, 41, 0.8))',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '24px',
              right: '24px',
              color: 'var(--text-on-dark)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{activeTrip.name}</h1>
              {activeTrip.isShared && <Badge variant="secondary">Community Public</Badge>}
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.85, margin: 0, maxWidth: '600px' }}>
              {activeTrip.description}
            </p>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '1.25rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            textAlign: 'center',
            gap: '1rem',
            borderTop: '1px solid var(--border-color-light)',
          }}
          className="summary-stats-grid"
        >
          <style>{`
            @media (max-width: 640px) {
              .summary-stats-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 1.25rem !important;
              }
            }
          `}</style>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Stops</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalStops} Cities</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalDays} Days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Activities</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalActivities} Scheduled</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Cost Est</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isOverBudget ? 'var(--color-error)' : 'var(--color-success)' }}>
              ${totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-City Route */}
      {activeTrip.destinations.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            Multi-City Route Sequence
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {activeTrip.destinations.map((dest, idx) => (
              <React.Fragment key={dest.id}>
                {idx > 0 && <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>→</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color-light)' }}>
                  <MapPin size={14} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{dest.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({dest.arrivalDate} to {dest.departureDate})</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '20px' }}>
        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.925rem',
            fontWeight: 700,
            color: activeTab === 'timeline' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'timeline' ? '2.5px solid var(--color-primary)' : 'none',
            cursor: 'pointer',
            marginBottom: '-1.5px',
          }}
        >
          Detailed Itinerary Timeline
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.925rem',
            fontWeight: 700,
            color: activeTab === 'budget' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'budget' ? '2.5px solid var(--color-primary)' : 'none',
            cursor: 'pointer',
            marginBottom: '-1.5px',
          }}
        >
          Itinerary Budget Audit
        </button>
      </div>

      {/* TAB CONTENT: TIMELINE */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {totalActivities > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
              {allActivities.map((act, idx) => (
                <TimelineItem
                  key={act.id}
                  activity={act}
                  isLast={idx === allActivities.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ marginBottom: '8px' }} />
              <p>No activities scheduled yet in this trip.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: BUDGET AUDIT */}
      {activeTab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Categories Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {Object.entries(spentByCategory).map(([cat, amount]) => {
              const limitEstimate = Math.round(activeTrip.budgetLimit * (cat === 'accommodation' ? 0.45 : cat === 'transport' ? 0.25 : 0.1));
              return (
                <BudgetCard
                  key={cat}
                  category={cat as any}
                  spent={amount}
                  limit={limitEstimate}
                  percentage={limitEstimate > 0 ? (amount / limitEstimate) * 100 : 0}
                />
              );
            })}
          </div>

          {/* Recharts Bar */}
          {chartData.length > 0 ? (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', height: '320px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Expenses Comparison by Category</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                    <YAxis fontSize={11} stroke="var(--text-muted)" />
                    <Tooltip formatter={(value) => `$${value ? Number(value).toLocaleString() : 0}`} />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
