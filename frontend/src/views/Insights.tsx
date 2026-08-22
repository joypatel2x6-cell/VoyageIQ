import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Trip } from '../data/mockData';
import {
  Sparkles, TrendingDown, CloudRain, Plane, AlertTriangle,
  CheckCircle2, Clock, Wallet, MapPin, ArrowRight, RefreshCw,
  Lightbulb, Shield, Star, BarChart2, Zap, Heart,
  ChevronRight, Info, X, Filter, Compass
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Insight Types & Generator
// ─────────────────────────────────────────────────────────────────────────────
type InsightPriority = 'critical' | 'warning' | 'info' | 'success' | 'tip';

interface Insight {
  id: string;
  tripId: string;
  tripName: string;
  priority: InsightPriority;
  category: 'budget' | 'weather' | 'flight' | 'pace' | 'activity' | 'health' | 'saving';
  title: string;
  body: string;
  action?: string;
  actionView?: string;
  savings?: number;
  dismissed?: boolean;
}

const PRIORITY_CONFIG: Record<InsightPriority, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertTriangle size={16} />, label: 'Action Required' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <AlertTriangle size={16} />, label: 'Warning' },
  info:     { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: <Info size={16} />, label: 'Info' },
  success:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={16} />, label: 'Great News' },
  tip:      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: <Lightbulb size={16} />, label: 'Smart Tip' },
};

const CAT_ICONS: Record<Insight['category'], React.ReactNode> = {
  budget:   <Wallet size={18} />,
  weather:  <CloudRain size={18} />,
  flight:   <Plane size={18} />,
  pace:     <Clock size={18} />,
  activity: <MapPin size={18} />,
  health:   <Shield size={18} />,
  saving:   <TrendingDown size={18} />,
};

function totalTripSpend(trip: Trip) {
  return trip.destinations.reduce((s, d) => s + d.activities.reduce((ss, a) => ss + a.cost, 0), 0);
}

function getDays(s: string, e: string) {
  return Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000);
}

// Generate dynamic insights from real trip data
function generateInsights(trips: Trip[]): Insight[] {
  const insights: Insight[] = [];

  trips.forEach((trip) => {
    const totalSpend = totalTripSpend(trip);
    const budgetPct  = totalSpend / trip.budgetLimit;
    const days       = getDays(trip.startDate, trip.endDate);
    const avgDaily   = days > 0 ? totalSpend / days : 0;
    const daysOut    = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000);

    // ── Budget insights ────────────────────────────────────────────────────
    if (budgetPct > 1) {
      insights.push({
        id: `${trip.id}-over-budget`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'critical',
        category: 'budget',
        title: 'Budget Exceeded',
        body: `Your total spend of ₹${totalSpend.toLocaleString()} exceeds your ₹${trip.budgetLimit.toLocaleString()} limit by ₹${(totalSpend - trip.budgetLimit).toLocaleString()}. Review and trim activities to get back on track.`,
        action: 'Review Budget',
        actionView: 'trip-summary',
        savings: totalSpend - trip.budgetLimit,
      });
    } else if (budgetPct > 0.85) {
      insights.push({
        id: `${trip.id}-near-budget`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'warning',
        category: 'budget',
        title: 'Approaching Budget Limit',
        body: `You've used ${Math.round(budgetPct * 100)}% of your ₹${trip.budgetLimit.toLocaleString()} budget. Only ₹${(trip.budgetLimit - totalSpend).toLocaleString()} remaining — consider cutting lower-priority activities.`,
        action: 'Optimise Trip',
        actionView: 'trip-summary',
      });
    } else if (budgetPct < 0.5 && totalSpend > 0) {
      insights.push({
        id: `${trip.id}-under-budget`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'success',
        category: 'budget',
        title: 'Well Within Budget',
        body: `Your ${trip.name} is tracking at only ${Math.round(budgetPct * 100)}% of budget. You have ₹${(trip.budgetLimit - totalSpend).toLocaleString()} to splurge on experiences you haven't planned yet!`,
        action: 'Discover Activities',
        actionView: 'things-to-do',
      });
    }

    // ── Pace / activity density ────────────────────────────────────────────
    const totalActivities = trip.destinations.reduce((s, d) => s + d.activities.length, 0);
    const activitiesPerDay = days > 0 ? totalActivities / days : 0;

    if (activitiesPerDay > 4) {
      insights.push({
        id: `${trip.id}-overpacked`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'warning',
        category: 'pace',
        title: 'Overpacked Itinerary',
        body: `You have ${totalActivities} activities across ${days} days (${activitiesPerDay.toFixed(1)} per day). This pace can lead to fatigue — consider spreading activities across an extra day or cutting 2–3 items.`,
        action: 'Review Itinerary',
        actionView: 'calendar',
      });
    } else if (totalActivities === 0 && days > 0) {
      insights.push({
        id: `${trip.id}-empty`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'info',
        category: 'activity',
        title: 'No Activities Scheduled',
        body: `${trip.name} starts on ${new Date(trip.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} but has no activities yet. Start planning to get the most from your trip.`,
        action: 'Add Activities',
        actionView: 'things-to-do',
      });
    }

    // ── Flight / booking window ────────────────────────────────────────────
    if (daysOut > 0 && daysOut <= 21 && daysOut > 7) {
      insights.push({
        id: `${trip.id}-book-soon`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'warning',
        category: 'flight',
        title: 'Book Transport Now',
        body: `${trip.name} is ${daysOut} days away. Last-minute transport bookings can cost 40–80% more. Check train and flight prices before they peak this weekend.`,
        action: 'Explore Flights',
        actionView: 'explore',
      });
    } else if (daysOut > 0 && daysOut <= 7) {
      insights.push({
        id: `${trip.id}-leaving-soon`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'critical',
        category: 'flight',
        title: `Departing in ${daysOut} Day${daysOut !== 1 ? 's' : ''}!`,
        body: `${trip.name} is almost here. Make sure your passports, visas, travel insurance, and all bookings are confirmed. Check-in windows for flights usually open 24–48 hours before departure.`,
        action: 'View Checklist',
        actionView: 'calendar',
      });
    } else if (daysOut > 60) {
      insights.push({
        id: `${trip.id}-early-bird`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'success',
        category: 'flight',
        title: 'Perfect Time to Book Flights',
        body: `${trip.name} is ${daysOut} days away — the ideal window to lock in the best flight prices (typically 6–8 weeks out). Prices start rising after the 45-day mark.`,
        savings: Math.round(avgDaily * 0.2 * days),
        action: 'Plan Transport',
        actionView: 'explore',
      });
    }

    // ── Weather insight for specific destinations ─────────────────────────
    const hasMonsoon = trip.destinations.some(d =>
      ['Mumbai', 'Bali', 'Bangkok', 'Ubud', 'Uluwatu'].some(c => d.name.includes(c))
    );
    if (hasMonsoon) {
      insights.push({
        id: `${trip.id}-monsoon`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'info',
        category: 'weather',
        title: 'Monsoon Season Alert',
        body: `One or more destinations in ${trip.name} are in a region with monsoon weather during your travel window. Pack a compact waterproof jacket, and book indoor backup activities.`,
        action: 'View Destinations',
        actionView: 'explore',
      });
    }

    // ── Accommodation missing ──────────────────────────────────────────────
    trip.destinations.forEach(dest => {
      const hasAccom = dest.activities.some(a => a.category === 'accommodation');
      if (!hasAccom && getDays(dest.arrivalDate, dest.departureDate) >= 1) {
        insights.push({
          id: `${trip.id}-${dest.id}-no-accom`,
          tripId: trip.id,
          tripName: trip.name,
          priority: 'warning',
          category: 'activity',
          title: `No Accommodation in ${dest.name}`,
          body: `Your itinerary for ${dest.name} has no accommodation booked. This is a ${getDays(dest.arrivalDate, dest.departureDate)}-night stay — add a hotel or rental to secure your spot.`,
          action: 'Add Hotel',
          actionView: 'things-to-do',
        });
      }
    });

    // ── Smart saving tip ───────────────────────────────────────────────────
    const hasPrivateTour = trip.destinations.some(d =>
      d.activities.some(a => a.title.toLowerCase().includes('private'))
    );
    if (hasPrivateTour) {
      insights.push({
        id: `${trip.id}-private-tour`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'tip',
        category: 'saving',
        title: 'Swap Private Tour for Group Tour',
        body: `You have private tour(s) in ${trip.name}. Switching to a small-group tour for the same experience typically saves ₹2,000–₹4,000 per person with little trade-off in quality.`,
        action: 'Explore Alternatives',
        actionView: 'things-to-do',
        savings: 3000,
      });
    }

    if (avgDaily > 8000) {
      insights.push({
        id: `${trip.id}-high-daily`,
        tripId: trip.id,
        tripName: trip.name,
        priority: 'tip',
        category: 'saving',
        title: 'High Daily Spend Detected',
        body: `Your average daily spend for ${trip.name} is ₹${Math.round(avgDaily).toLocaleString()} — above the typical ₹6,000–₹7,000 range for this type of trip. Review food and activity costs.`,
        action: 'Optimise Budget',
        actionView: 'trip-summary',
        savings: Math.round((avgDaily - 7000) * days),
      });
    }
  });

  // Static global insights (platform-level)
  insights.push({
    id: 'global-community',
    tripId: '',
    tripName: 'Community',
    priority: 'tip',
    category: 'activity',
    title: 'Top Community Itineraries This Week',
    body: 'The Norwegian Fjords & Arctic Wilderness itinerary has been liked 612 times this week. Travellers say the Trolltunga hike is the single best outdoor experience in Europe.',
    action: 'View Community',
    actionView: 'community',
  });

  insights.push({
    id: 'global-price-alert',
    tripId: '',
    tripName: 'Price Alert',
    priority: 'success',
    category: 'flight',
    title: 'Flight Deals Detected',
    body: 'Smart Scanner has identified a 23% price drop on flights from Mumbai to Paris for October departures — from ₹62,000 to ₹47,800. Book before Sunday for the best rates.',
    action: 'Explore Destinations',
    actionView: 'explore',
    savings: 14200,
  });

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Score Meter Component
// ─────────────────────────────────────────────────────────────────────────────
const TripHealthScore: React.FC<{ trip: Trip }> = ({ trip }) => {
  const { setCurrentView, setActiveTripId } = useApp();
  const totalSpend   = totalTripSpend(trip);
  const budgetPct    = trip.budgetLimit > 0 ? totalSpend / trip.budgetLimit : 0;
  const days         = getDays(trip.startDate, trip.endDate);
  const totalActs    = trip.destinations.reduce((s, d) => s + d.activities.length, 0);
  const actsPerDay   = days > 0 ? totalActs / days : 0;
  const hasAccom     = trip.destinations.every(d => d.activities.some(a => a.category === 'accommodation'));

  // Score calculation
  let score = 100;
  if (budgetPct > 1) score -= 30;
  else if (budgetPct > 0.85) score -= 12;
  if (actsPerDay > 5) score -= 15;
  if (actsPerDay === 0) score -= 20;
  if (!hasAccom) score -= 10;
  if (totalActs === 0) score -= 20;
  score = Math.max(0, Math.min(100, score));

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 80 ? 'Healthy' : score >= 60 ? 'Needs Attention' : 'At Risk';

  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div
      style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
      onClick={() => { setActiveTripId(trip.id); setCurrentView('trip-summary'); }}
      onMouseEnter={e => e.currentTarget.style.borderColor = scoreColor + '60'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color-light)'}
    >
      {/* Radial gauge */}
      <div style={{ flexShrink: 0, position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={scoreColor} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: scoreColor }}>{score}</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health</span>
        </div>
      </div>

      {/* Trip info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: scoreColor + '20', color: scoreColor }}>{scoreLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>₹{totalSpend.toLocaleString()} / ₹{trip.budgetLimit.toLocaleString()}</span>
          <span>·</span>
          <span>{totalActs} activities</span>
        </div>
      </div>

      <ChevronRight size={16} color="var(--text-light)" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Insight Card
// ─────────────────────────────────────────────────────────────────────────────
const InsightCard: React.FC<{
  insight: Insight;
  onDismiss: (id: string) => void;
  onAction: (view: string, tripId: string) => void;
}> = ({ insight, onDismiss, onAction }) => {
  const cfg = PRIORITY_CONFIG[insight.priority];

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: `1px solid ${cfg.color}30`, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      className="card-hover">
      {/* Priority stripe */}
      <div style={{ height: 3, backgroundColor: cfg.color, width: '100%' }} />

      <div style={{ padding: '1.1rem 1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', backgroundColor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
              {cfg.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{insight.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: cfg.bg, color: cfg.color, padding: '1px 7px', borderRadius: 'var(--radius-full)' }}>{cfg.label}</span>
                {insight.tripName && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MapPin size={9} /> {insight.tripName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => onDismiss(insight.id)}
            style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--text-light)', cursor: 'pointer', padding: 2, borderRadius: 4, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {insight.body}
        </p>

        {/* Savings badge + action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {insight.savings && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.775rem', fontWeight: 800, color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
              <TrendingDown size={12} />
              Save up to ₹{insight.savings.toLocaleString()}
            </div>
          )}
          {insight.action && insight.actionView && (
            <button
              onClick={() => onAction(insight.actionView!, insight.tripId)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 700, color: cfg.color, border: `1px solid ${cfg.color}40`, backgroundColor: cfg.bg, padding: '4px 12px', borderRadius: 'var(--radius-full)', cursor: 'pointer', transition: 'all 0.15s', marginLeft: 'auto' }}>
              {insight.action} <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main Insights Page
// ─────────────────────────────────────────────────────────────────────────────
const CATS = ['All', 'budget', 'flight', 'weather', 'pace', 'activity', 'saving', 'health'] as const;
const PRIORITIES = ['All', 'critical', 'warning', 'success', 'tip', 'info'] as const;

export const Insights: React.FC = () => {
  const { trips, setCurrentView, setActiveTripId } = useApp();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const allInsights = useMemo(() => generateInsights(trips), [trips, refreshKey]);

  const visible = useMemo(() => {
    return allInsights.filter(i => {
      if (dismissed.has(i.id)) return false;
      if (catFilter !== 'All' && i.category !== catFilter) return false;
      if (priorityFilter !== 'All' && i.priority !== priorityFilter) return false;
      return true;
    });
  }, [allInsights, dismissed, catFilter, priorityFilter]);

  const handleDismiss = (id: string) => setDismissed(prev => new Set([...prev, id]));
  const handleAction  = (view: string, tripId: string) => {
    if (tripId) setActiveTripId(tripId);
    setCurrentView(view as any);
  };

  // Summary counts
  const criticalCount = visible.filter(i => i.priority === 'critical').length;
  const warningCount  = visible.filter(i => i.priority === 'warning').length;
  const totalSavings  = visible.reduce((s, i) => s + (i.savings || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} className="animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Sparkles size={22} color="var(--color-primary)" />
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>Smart Insights</h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            AI-powered recommendations to optimise every trip you plan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', fontSize: '0.825rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: `1px solid ${showFilters ? 'var(--color-primary)' : 'var(--border-color)'}`, backgroundColor: showFilters ? 'rgba(99,102,241,0.08)' : 'transparent', color: showFilters ? 'var(--color-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>
            <Filter size={14} /> Filter
          </button>
          <button
            onClick={() => { setDismissed(new Set()); setRefreshKey(k => k + 1); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', fontSize: '0.825rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Summary stat bar ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { icon: <AlertTriangle size={18} color="#ef4444" />, label: 'Critical Alerts', value: criticalCount, color: '#ef4444', bg: 'rgba(239,68,68,0.07)' },
          { icon: <AlertTriangle size={18} color="#f59e0b" />, label: 'Warnings', value: warningCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
          { icon: <Lightbulb size={18} color="#8b5cf6" />, label: 'Total Insights', value: visible.length, color: '#8b5cf6', bg: 'rgba(139,92,246,0.07)' },
          { icon: <TrendingDown size={18} color="#10b981" />, label: 'Potential Savings', value: totalSavings > 0 ? `₹${totalSavings.toLocaleString()}` : '—', color: '#10b981', bg: 'rgba(16,185,129,0.07)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '1rem 1.1rem', borderRadius: 'var(--radius-lg)', border: `1px solid ${s.color}25`, backgroundColor: s.bg, display: 'flex', alignItems: 'center', gap: 12 }}>
            {s.icon}
            <div>
              <div style={{ fontSize: typeof s.value === 'string' ? '1rem' : '1.4rem', fontWeight: 900, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      {showFilters && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', fontSize: '0.775rem', fontWeight: 700, borderRadius: 'var(--radius-full)', border: `1px solid ${catFilter === c ? 'var(--color-primary)' : 'var(--border-color)'}`, backgroundColor: catFilter === c ? 'rgba(99,102,241,0.1)' : 'transparent', color: catFilter === c ? 'var(--color-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>
                    {c !== 'All' && CAT_ICONS[c as Insight['category']]} {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRIORITIES.map(p => {
                  const cfg = p !== 'All' ? PRIORITY_CONFIG[p] : null;
                  return (
                    <button key={p} onClick={() => setPriorityFilter(p)}
                      style={{ padding: '4px 12px', fontSize: '0.775rem', fontWeight: 700, borderRadius: 'var(--radius-full)', border: `1px solid ${priorityFilter === p ? (cfg?.color || 'var(--color-primary)') : 'var(--border-color)'}`, backgroundColor: priorityFilter === p ? (cfg?.color || 'var(--color-primary)') + '18' : 'transparent', color: priorityFilter === p ? (cfg?.color || 'var(--color-primary)') : 'var(--text-muted)', cursor: 'pointer' }}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="insights-grid">
        <style>{`
          @media (min-width: 1100px) {
            .insights-grid { grid-template-columns: 2fr 1fr !important; }
          }
        `}</style>

        {/* Left: Insights feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {visible.length} Insight{visible.length !== 1 ? 's' : ''} {catFilter !== 'All' ? `· ${catFilter}` : ''} {priorityFilter !== 'All' ? `· ${priorityFilter}` : ''}
            </h3>
            {dismissed.size > 0 && (
              <button onClick={() => setDismissed(new Set())}
                style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                Restore {dismissed.size} dismissed
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-color-light)' }}>
              <CheckCircle2 size={40} color="var(--color-success)" style={{ marginBottom: 12 }} />
              <h3 style={{ margin: '0 0 6px', fontWeight: 700 }}>All Clear!</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>No insights match your current filters. Try adjusting or refreshing.</p>
            </div>
          ) : (
            // Sort: critical first, then warning, then rest
            [...visible]
              .sort((a, b) => {
                const order: Record<InsightPriority, number> = { critical: 0, warning: 1, info: 2, success: 3, tip: 4 };
                return order[a.priority] - order[b.priority];
              })
              .map(insight => (
                <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} onAction={handleAction} />
              ))
          )}
        </div>

        {/* Right: Trip Health panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Health scores */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <BarChart2 size={18} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Trip Health Scores</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {trips.length > 0 ? trips.map(t => <TripHealthScore key={t.id} trip={t} />) : (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No trips yet. Create one to see health scores.</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <Zap size={18} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Quick Actions</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Discover Activities', icon: <MapPin size={15} />, view: 'things-to-do', color: '#10b981' },
                { label: 'Explore Destinations', icon: <Compass size={15} />, view: 'explore', color: '#06b6d4' },
                { label: 'View Community Trips', icon: <Heart size={15} />, view: 'community', color: '#f43f5e' },
                { label: 'Open Calendar', icon: <Clock size={15} />, view: 'calendar', color: '#8b5cf6' },
                { label: 'Plan a New Trip', icon: <Star size={15} />, view: 'plan-trip', color: '#f97316' },
              ].map(qa => (
                <button key={qa.view} onClick={() => setCurrentView(qa.view as any)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', fontSize: '0.825rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color-light)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = qa.color + '60'; e.currentTarget.style.color = qa.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{qa.icon} {qa.label}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Pro tip card */}
          <div style={{ borderRadius: 'var(--radius-xl)', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VoyageIQ Pro Tip</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Book multi-city trips using <strong>open-jaw flights</strong> (fly into one city, out of another) — they're often cheaper than round trips and eliminate unnecessary backtracking.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
