import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Edit3, Calendar, MapPin, Share2, Download, Sparkles, AlertTriangle, Coins, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TimelineItem } from '../components/TimelineItem';
import { Badge } from '../components/ui/Badge';
import { SmartInsightCard } from '../components/SmartInsightCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  INR: '₹',
};

const categoryLabels: Record<string, string> = {
  accommodation: 'Accommodation',
  transport: 'Transport',
  food: 'Food & Dining',
  activity: 'Activities',
  shopping: 'Shopping',
  other: 'Other',
};

const categoryCOLORS = ['#8b5cf6', '#06b6d4', '#f43f5e', '#10b981', '#ec4899', '#64748b'];

export const TripSummary: React.FC = () => {
  const { trips, activeTripId, updateTrip, setCurrentView, showToast } = useApp();
  const activeTrip = trips.find((t) => t.id === activeTripId);
  const [activeTab, setActiveTab] = useState<'timeline' | 'budget'>('budget');
  const [isOptimizing, setIsOptimizing] = useState(false);

  if (!activeTrip) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>No active trip selected.</p>
        <Button onClick={() => setCurrentView('my-trips')} size="sm">Go Back</Button>
      </div>
    );
  }

  const symbol = currencySymbols[activeTrip.currency || 'USD'] || '$';

  // Compute total expenses from all activities
  const totalCost = activeTrip.destinations.reduce(
    (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
    0
  );

  const isOverBudget = totalCost > activeTrip.budgetLimit;
  const budgetDiff = Math.abs(activeTrip.budgetLimit - totalCost);
  const budgetPercent = Math.min(Math.round((totalCost / activeTrip.budgetLimit) * 100), 100);

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
      const cat = act.category;
      // Map legacy categories
      if (cat === 'accommodation') categories.accommodation += act.cost;
      else if (cat === 'transport') categories.transport += act.cost;
      else if (cat === 'food') categories.food += act.cost;
      else if (cat === 'shopping') categories.shopping += act.cost;
      else if (['sightseeing', 'adventure', 'culture', 'entertainment', 'nature', 'activity'].includes(cat as string)) {
        categories.activity += act.cost;
      } else {
        categories.other += act.cost;
      }
    });
    return categories;
  };

  const spentByCategory = getExpensesByCategory();

  // Recharts Category Donut Data
  const donutChartData = Object.entries(spentByCategory)
    .map(([key, val]) => ({
      name: categoryLabels[key] || key,
      value: val,
    }))
    .filter(item => item.value > 0);

  // Daily Spending Calculation
  const getDailySpending = () => {
    const dailyMap: Record<string, number> = {};
    
    // Prefill with all trip dates
    const start = new Date(activeTrip.startDate);
    const end = new Date(activeTrip.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyMap[dateStr] = 0;
    }

    allActivities.forEach((act) => {
      if (dailyMap[act.date] !== undefined) {
        dailyMap[act.date] += act.cost;
      }
    });

    return Object.entries(dailyMap).map(([date, amount]) => {
      const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: formattedDate,
        amount,
        rawDate: date,
      };
    });
  };

  const dailySpending = getDailySpending();
  const averageDailyCost = totalCost / (totalDays || 1);

  // Budget vs Actual data
  const comparisonData = [
    { name: 'Trip Limit', Amount: activeTrip.budgetLimit },
    { name: 'Actual Spent', Amount: totalCost },
  ];

  // Dynamic Health Score
  const getHealthScore = () => {
    let budgetScore = 95;
    if (totalCost > activeTrip.budgetLimit) {
      const penalty = ((totalCost - activeTrip.budgetLimit) / activeTrip.budgetLimit) * 100;
      budgetScore = Math.max(50, 95 - penalty);
    } else if (totalCost === 0) {
      budgetScore = 80;
    }
    
    let paceScore = 90;
    const paceRatio = totalStops / (totalDays || 1);
    if (paceRatio > 0.5) paceScore = 75; // rushed
    else if (paceRatio > 0.3) paceScore = 88; // balanced
    
    let activitiesScore = 92;
    const density = totalActivities / (totalDays || 1);
    if (density > 3) activitiesScore = 80; // too busy
    else if (density === 0) activitiesScore = 60; // empty
    
    const finalScore = Math.round((budgetScore + paceScore + activitiesScore) / 3);
    return {
      score: finalScore || 87,
      budget: Math.round(budgetScore),
      pace: Math.round(paceScore),
      activities: Math.round(activitiesScore),
      time: 90,
    };
  };

  const health = getHealthScore();

  // Dynamic Smart Saving Recommendation
  const getSmartRecommendation = () => {
    if (allActivities.length > 0) {
      const expensiveAct = [...allActivities].sort((a, b) => b.cost - a.cost)[0];
      if (expensiveAct.cost > 1000) {
        const potentialSavings = Math.round(expensiveAct.cost * 0.4);
        return `Replace the premium reservation for "${expensiveAct.title}" with a public guided group excursion or early-bird pass to save approximately ${symbol}${potentialSavings.toLocaleString()}.`;
      }
    }
    return `Swap the private city-center transfers with express transit trains to save approximately ${symbol}2,800 on local transport.`;
  };

  const recommendation = getSmartRecommendation();

  // Actions
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

  const handleOptimizeTrip = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      showToast('Itinerary optimized! High-cost activity slots adjusted to target budget goals.', 'success');
    }, 1500);
  };

  // Format dates: YYYY-MM-DD to "12 Jun"
  const formatDateShort = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      
      {/* Top action header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => setCurrentView('my-trips')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back to Trips
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShareTrip}
            leftIcon={<Share2 size={14} />}
          >
            {activeTrip.isShared ? 'Shared (Unpublish)' : 'Share Trip'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              showToast('Generating printable PDF budget summary...', 'info');
              setTimeout(() => {
                showToast('Budget PDF report downloaded!', 'success');
              }, 1200);
            }}
            leftIcon={<Download size={14} />}
          >
            Download Report
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentView('calendar')}
            leftIcon={<Calendar size={14} />}
          >
            View Calendar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCurrentView('plan-trip');
            }}
            leftIcon={<Edit3 size={14} />}
          >
            Edit Itinerary
          </Button>
        </div>
      </div>

      {/* Presentation Header Block */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-color-light)',
        }}
      >
        <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
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
              background: 'linear-gradient(to bottom, rgba(11, 19, 41, 0.1), rgba(11, 19, 41, 0.85))',
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
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0 }}>{activeTrip.name}</h1>
                {activeTrip.isShared && <Badge variant="secondary">Public</Badge>}
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.85, margin: 0, maxWidth: '550px' }}>
                {activeTrip.description}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '6px 14px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(4px)' }}>
              <Calendar size={14} />
              <span>{formatDateShort(activeTrip.startDate)} → {formatDateShort(activeTrip.endDate)}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{totalDays} Days</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{totalStops} Cit{totalStops !== 1 ? 'ies' : 'y'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-City Sequence Line */}
      {activeTrip.destinations.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em', margin: 0 }}>
            Multi-City Route Stops Sequence
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            {activeTrip.destinations.map((dest, idx) => (
              <React.Fragment key={dest.id}>
                {idx > 0 && <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>→</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color-light)' }}>
                  <MapPin size={13} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>{dest.name}</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>({formatDateShort(dest.arrivalDate)} to {formatDateShort(dest.departureDate)})</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── VoyageIQ Smart Insight ─────────────────────────────────────────── */}
      <SmartInsightCard
        trip={activeTrip}
        maxVisible={1}
        onAction={() => showToast('Recommendation noted! Review your itinerary to apply changes.', 'info')}
      />

      {/* Tab Selectors */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '20px' }}>
        <button
          onClick={() => setActiveTab('budget')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.925rem',
            fontWeight: 700,
            color: activeTab === 'budget' ? 'var(--color-primary)' : 'var(--text-muted)',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'budget' ? '2.5px solid var(--color-primary)' : 'none',
            cursor: 'pointer',
            marginBottom: '-1.5px',
          }}
        >
          Financial Overview & Audits
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.925rem',
            fontWeight: 700,
            color: activeTab === 'timeline' ? 'var(--color-primary)' : 'var(--text-muted)',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'timeline' ? '2.5px solid var(--color-primary)' : 'none',
            cursor: 'pointer',
            marginBottom: '-1.5px',
          }}
        >
          Detailed Trip Timeline
        </button>
      </div>

      {/* TAB CONTENT: TIMELINE */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
          {totalActivities > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
              {allActivities.map((act, idx) => (
                <TimelineItem
                  key={act.id}
                  activity={act}
                  isLast={idx === allActivities.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px dashed var(--border-color-light)' }}>
              <Calendar size={36} style={{ marginBottom: '8px' }} color="var(--text-light)" />
              <p>No activities scheduled yet in this trip. Add excursions using the planner.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: BUDGET AUDIT */}
      {activeTab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
          
          {/* Top Row: Budget Progress bar & Health Score */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'stretch' }} className="budget-top-grid">
            <style>{`
              @media (max-width: 768px) {
                .budget-top-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>

            {/* Progress Card */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color-light)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Trip Budget Progress
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>
                    {symbol}{totalCost.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    spent of {symbol}{activeTrip.budgetLimit.toLocaleString()} limit
                  </span>
                </div>
              </div>

              {/* Progress Slider */}
              <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${budgetPercent}%`,
                    height: '100%',
                    backgroundColor: isOverBudget ? 'var(--color-error)' : budgetPercent > 85 ? 'var(--color-warning)' : 'var(--color-success)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{budgetPercent}% allocated</span>
                {isOverBudget ? (
                  <span style={{ color: 'var(--color-error)' }}>Exceeded by {symbol}{budgetDiff.toLocaleString()}</span>
                ) : (
                  <span style={{ color: 'var(--color-success)' }}>{symbol}{budgetDiff.toLocaleString()} remaining</span>
                )}
              </div>
            </div>

            {/* Health Score Card */}
            <div
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color-light)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Trip Health Score
              </span>
              <div style={{ position: 'relative', width: '85px', height: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="85" height="85" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="42.5" cy="42.5" r="36" fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="6" />
                  <circle cx="42.5" cy="42.5" r="36" fill="transparent" stroke="var(--color-primary)" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - health.score / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <span style={{ position: 'absolute', fontSize: '1.35rem', fontWeight: 800 }}>{health.score}</span>
              </div>
              
              {/* Breakdown sub-text */}
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.675rem', color: 'var(--text-muted)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>Budget: {health.budget}/100</span>
                <span>•</span>
                <span>Pace: {health.pace}/100</span>
                <span>•</span>
                <span>Time: {health.time}/100</span>
              </div>
            </div>
          </div>

          {/* Over-Budget warning alert banner */}
          {isOverBudget && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--color-error)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <AlertTriangle size={20} />
              <span>Budget exceeded by {symbol}{budgetDiff.toLocaleString()}! Try optimizing your activities or shifting lodging choices.</span>
            </div>
          )}

          {/* Category Cards financial overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Expenses Categories Breakdown
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginTop: '6px' }}>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-color-light)' }}>
                <span style={{ fontSize: '0.725rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase' }}>Transport</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{symbol}{spentByCategory.transport.toLocaleString()}</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-color-light)' }}>
                <span style={{ fontSize: '0.725rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase' }}>Accommodation</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{symbol}{spentByCategory.accommodation.toLocaleString()}</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-color-light)' }}>
                <span style={{ fontSize: '0.725rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Activities</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{symbol}{spentByCategory.activity.toLocaleString()}</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-color-light)' }}>
                <span style={{ fontSize: '0.725rem', color: '#f43f5e', fontWeight: 700, textTransform: 'uppercase' }}>Food</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{symbol}{spentByCategory.food.toLocaleString()}</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-color-light)' }}>
                <span style={{ fontSize: '0.725rem', color: '#ec4899', fontWeight: 700, textTransform: 'uppercase' }}>Shopping</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{symbol}{spentByCategory.shopping.toLocaleString()}</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-color-light)' }}>
                <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Other</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{symbol}{spentByCategory.other.toLocaleString()}</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--color-primary)' }}>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Spent</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)' }}>{symbol}{totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Block */}
          {donutChartData.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              
              {/* Category donut distribution */}
              <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', height: '330px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Expenses Share by Category
                </h3>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={categoryCOLORS[index % categoryCOLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${symbol}${Number(value).toLocaleString()}`} />
                      <Legend verticalAlign="bottom" height={36} iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily spending timeline chart */}
              <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', height: '330px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Daily Spending Timeline
                </h3>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" fontSize={10} stroke="var(--text-muted)" />
                      <YAxis fontSize={10} stroke="var(--text-muted)" />
                      <Tooltip formatter={(value) => `${symbol}${Number(value).toLocaleString()}`} />
                      <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                        {dailySpending.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.amount > averageDailyCost ? 'var(--color-warning)' : 'var(--color-primary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget vs Actual Comparison */}
              <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', height: '330px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Limit vs Actual comparison
                </h3>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                      <YAxis fontSize={11} stroke="var(--text-muted)" />
                      <Tooltip formatter={(value) => `${symbol}${Number(value).toLocaleString()}`} />
                      <Bar dataKey="Amount" fill="var(--color-success)" radius={[4, 4, 0, 0]}>
                        <Cell fill="var(--bg-tertiary)" />
                        <Cell fill={isOverBudget ? 'var(--color-error)' : 'var(--color-success)'} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px dashed var(--border-color-light)' }}>
              <Coins size={32} style={{ marginBottom: '8px' }} color="var(--text-light)" />
              <p>Schedule activities to view expense distribution graphs.</p>
            </div>
          )}

          {/* Daily Costs & Highlight Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="budget-details-grid">
            <style>{`
              @media (max-width: 768px) {
                .budget-details-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>

            {/* Daily Costs analysis */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Daily Spending Analysis
                </h3>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{symbol}{Math.round(averageDailyCost).toLocaleString()}/day</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>average daily cost</span>
                </div>
              </div>

              {/* List of days */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {dailySpending.map((day, i) => {
                  const isAbove = day.amount > averageDailyCost;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', padding: '6px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: isAbove ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-tertiary)' }}>
                      <span>{day.date}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{symbol}{day.amount.toLocaleString()}</span>
                        {isAbove && (
                          <span style={{ fontSize: '0.675rem', fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                            Above Avg
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Recommendations & Optimization */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Smart Financial Insight
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {recommendation}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color-light)', paddingTop: '1rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={13} color="var(--color-primary)" /> Save up to 40%
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOptimizeTrip}
                  disabled={isOptimizing}
                  leftIcon={<RefreshCw size={14} className={isOptimizing ? 'animate-spin' : ''} />}
                >
                  {isOptimizing ? 'Optimizing...' : 'Optimize Trip'}
                </Button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
