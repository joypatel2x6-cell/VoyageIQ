import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { CommunityPost } from '../data/mockData';
import {
  Heart, MessageSquare, Copy, Calendar, MapPin, Search,
  Users, Globe, X, Eye, Filter, TrendingUp,
  Compass, ChevronRight, Clock, Wallet
} from 'lucide-react';
import { Button } from '../components/ui/Button';

// ── helpers ────────────────────────────────────────────────────────────────────
const STYLE_COLORS: Record<string, string> = {
  Luxury: '#8b5cf6',
  Balanced: '#06b6d4',
  Budget: '#10b981',
};

const TAG_COLORS: Record<string, string> = {
  Adventure: '#f97316',
  Nature: '#22c55e',
  Luxury: '#8b5cf6',
  Culture: '#6d28d9',
  Budget: '#10b981',
  Coastal: '#06b6d4',
  Desert: '#eab308',
  Historic: '#78716c',
  Culinary: '#f43f5e',
  Iceland: '#0ea5e9',
  Greece: '#2563eb',
  Bali: '#84cc16',
  Norway: '#60a5fa',
  Morocco: '#f59e0b',
};

const SORT_OPTIONS = ['Most Popular', 'Most Recent', 'Most Commented', 'Lowest Budget', 'Highest Budget'];
const TRAVEL_STYLES = ['All Styles', 'Budget', 'Balanced', 'Luxury'];
const DURATION_BUCKETS = ['Any Duration', 'Weekend (1-4 days)', 'Short Trip (5-7 days)', 'Long Trip (8-14 days)', 'Extended (15+ days)'];

function getDays(start: string, end: string) {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

function formatDateRange(start: string, end: string) {
  const fmt = (s: string) => new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return `${fmt(start)} → ${fmt(end)}`;
}

function getTripCost(post: CommunityPost) {
  return post.trip.destinations.reduce(
    (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
    0
  );
}

// ── Read-Only Trip Detail Modal ────────────────────────────────────────────────
const TripDetailModal: React.FC<{ post: CommunityPost; onClose: () => void; onCopy: () => void }> = ({
  post, onClose, onCopy,
}) => {
  const days = getDays(post.trip.startDate, post.trip.endDate);
  const totalCost = getTripCost(post);
  const symbol = post.trip.currency === 'EUR' ? '€' : post.trip.currency === 'INR' ? '₹' : '$';
  const allActivities = post.trip.destinations
    .flatMap(d => d.activities)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const catColors: Record<string, string> = {
    food: '#f43f5e', transport: '#06b6d4', accommodation: '#8b5cf6',
    activity: '#10b981', culture: '#6d28d9', adventure: '#f97316',
    shopping: '#ec4899', entertainment: '#eab308', nature: '#22c55e', other: '#64748b',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(11,19,41,0.8)',
        backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '680px', maxHeight: '88vh',
          backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          animation: 'modal-scale 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cover header */}
        <div style={{ position: 'relative', height: '200px', flexShrink: 0 }}>
          <img
            src={post.trip.destinations[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop'}
            alt={post.trip.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,19,41,0.05), rgba(11,19,41,0.88))' }} />
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(15,23,42,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
          <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <img src={post.authorAvatar} alt={post.authorName} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)' }} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', fontWeight: 600 }}>{post.authorName}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>· Read-only community trip</span>
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{post.trip.name}</h2>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Quick stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Duration', value: `${days} Days` },
              { label: 'Stops', value: `${post.trip.destinations.length} Cities` },
              { label: 'Spent', value: `${symbol}${totalCost.toLocaleString()}` },
              { label: 'Budget', value: `${symbol}${post.trip.budgetLimit.toLocaleString()}` },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {post.trip.description}
          </p>

          {/* Route sequence */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Multi-City Route</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {post.trip.destinations.map((dest, i) => (
                <React.Fragment key={dest.id}>
                  {i > 0 && <ChevronRight size={14} color="var(--text-light)" />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color-light)', fontSize: '0.8rem', fontWeight: 700 }}>
                    <MapPin size={12} color="var(--color-primary)" />
                    {dest.name}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      ({getDays(dest.arrivalDate, dest.departureDate)} nights)
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Activity timeline */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Scheduled Activities ({allActivities.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allActivities.map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${catColors[act.category] || '#64748b'}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{act.title}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={11} />{act.date}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{act.time}</span>
                      {act.cost > 0 && <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{symbol}{act.cost.toLocaleString()}</span>}
                      {act.cost === 0 && <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Free</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: catColors[act.category] || '#64748b', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', flexShrink: 0 }}>
                    {act.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={14} color="var(--color-error)" /> {post.likesCount} likes</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={14} /> {post.commentsCount} comments</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            <Button variant="primary" size="sm" leftIcon={<Copy size={14} />} onClick={onCopy}>
              Copy Trip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Community Card ─────────────────────────────────────────────────────────────
const CommunityCard: React.FC<{
  post: CommunityPost;
  onLike: () => void;
  onView: () => void;
  onCopy: () => void;
}> = ({ post, onLike, onView, onCopy }) => {
  const days = getDays(post.trip.startDate, post.trip.endDate);
  const totalCost = getTripCost(post);
  const symbol = post.trip.currency === 'EUR' ? '€' : post.trip.currency === 'INR' ? '₹' : '$';
  const style = post.trip.travelStyle || 'Balanced';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color-light)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-md)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      className="card-hover"
    >
      {/* Cover image with gradient */}
      <div style={{ position: 'relative', paddingTop: '56%', overflow: 'hidden', cursor: 'pointer' }} onClick={onView}>
        <img
          src={post.trip.destinations[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop'}
          alt={post.trip.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(11,19,41,0.88))' }} />

        {/* Travel style badge */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: STYLE_COLORS[style] || '#64748b', color: '#fff', padding: '3px 9px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {style}
          </span>
        </div>

        {/* Like count overlay */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', padding: '3px 9px', borderRadius: 'var(--radius-full)', fontSize: '0.725rem', fontWeight: 700, color: '#fff' }}>
          <Heart size={11} fill="#ef4444" color="#ef4444" />
          {post.likesCount}
        </div>

        {/* Trip name + place overlay at bottom */}
        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.trip.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <img src={post.authorAvatar} alt={post.authorName} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.6)', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{post.authorName}</span>
            {post.trip.destinations.length > 0 && (
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                · 📍 {post.trip.destinations.map(d => d.name).join(' → ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content body */}
      <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {post.tags.map(tag => (
            <span key={tag} style={{ fontSize: '0.625rem', fontWeight: 700, backgroundColor: (TAG_COLORS[tag] || '#64748b') + '22', color: TAG_COLORS[tag] || 'var(--text-muted)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: `1px solid ${(TAG_COLORS[tag] || '#64748b')}44` }}>
              {tag}
            </span>
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
          {post.trip.name}
        </h3>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.trip.description}
        </p>

        {/* Trip stats chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.725rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: '3px 9px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
            <Calendar size={11} />{formatDateRange(post.trip.startDate, post.trip.endDate)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.725rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: '3px 9px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
            <Clock size={11} />{days} Days
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.725rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: '3px 9px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
            <MapPin size={11} />{post.trip.destinations.length} Cit{post.trip.destinations.length !== 1 ? 'ies' : 'y'}
          </span>
          {post.trip.travelersCount && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.725rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: '3px 9px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
              <Users size={11} />{post.trip.travelersCount} Traveler{post.trip.travelersCount !== 1 ? 's' : ''}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.725rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: '3px 9px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
            <Wallet size={11} />{symbol}{totalCost.toLocaleString()} spent
          </span>
        </div>

        {/* Route sequence mini */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {post.trip.destinations.map((dest, i) => (
            <React.Fragment key={dest.id}>
              {i > 0 && <span style={{ color: 'var(--text-light)', fontSize: '0.7rem' }}>→</span>}
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{dest.name}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Engagement stats */}
        <div style={{ display: 'flex', gap: 14 }}>
          <button
            onClick={onLike}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', transition: 'color 0.2s' }}
          >
            <Heart size={15} color="#ef4444" fill="rgba(239,68,68,0.15)" />{post.likesCount}
          </button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <MessageSquare size={15} color="var(--text-light)" />{post.commentsCount}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="ghost" size="sm" leftIcon={<Eye size={13} />} onClick={onView}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            View Trip
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Copy size={13} />} onClick={onCopy}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            Copy Trip
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Community Page ────────────────────────────────────────────────────────
export const Community: React.FC = () => {
  const { communityPosts, cloneTrip, likeCommunityPost, showToast, setSharedTripId, setCurrentView } = useApp();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('All Styles');
  const [selectedDuration, setSelectedDuration] = useState('Any Duration');
  const [maxBudget, setMaxBudget] = useState('');
  const [sortBy, setSortBy] = useState('Most Popular');
  const [groupBy, setGroupBy] = useState<'style' | 'duration' | 'none'>('none');
  const [viewPost, setViewPost] = useState<CommunityPost | null>(null);
  const [showFilters, setShowFilters] = useState(false);


  // Derived: filter + sort
  const filtered = useMemo(() => {
    let list = [...communityPosts];

    // Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.trip.name.toLowerCase().includes(q) ||
        p.trip.description.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.trip.destinations.some(d => d.name.toLowerCase().includes(q))
      );
    }

    // Travel style
    if (selectedStyle !== 'All Styles') {
      list = list.filter(p => p.trip.travelStyle === selectedStyle);
    }

    // Duration
    if (selectedDuration !== 'Any Duration') {
      list = list.filter(p => {
        const days = getDays(p.trip.startDate, p.trip.endDate);
        if (selectedDuration === 'Weekend (1-4 days)') return days <= 4;
        if (selectedDuration === 'Short Trip (5-7 days)') return days >= 5 && days <= 7;
        if (selectedDuration === 'Long Trip (8-14 days)') return days >= 8 && days <= 14;
        if (selectedDuration === 'Extended (15+ days)') return days >= 15;
        return true;
      });
    }

    // Budget cap
    if (maxBudget.trim()) {
      const cap = Number(maxBudget);
      if (!isNaN(cap) && cap > 0) {
        list = list.filter(p => getTripCost(p) <= cap);
      }
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'Most Popular') return b.likesCount - a.likesCount;
      if (sortBy === 'Most Commented') return b.commentsCount - a.commentsCount;
      if (sortBy === 'Most Recent') return new Date(b.trip.startDate).getTime() - new Date(a.trip.startDate).getTime();
      if (sortBy === 'Lowest Budget') return getTripCost(a) - getTripCost(b);
      if (sortBy === 'Highest Budget') return getTripCost(b) - getTripCost(a);
      return 0;
    });

    return list;
  }, [communityPosts, searchTerm, selectedStyle, selectedDuration, maxBudget, sortBy]);

  // Grouped community posts computation
  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(post => {
      let key = 'Other';
      if (groupBy === 'style') {
        key = `${post.trip.travelStyle || 'Balanced'} Travel`;
      } else if (groupBy === 'duration') {
        const d = getDays(post.trip.startDate, post.trip.endDate);
        if (d <= 4) key = 'Weekend Trips (1-4 days)';
        else if (d <= 7) key = 'Short Trips (5-7 days)';
        else if (d <= 14) key = 'Long Trips (8-14 days)';
        else key = 'Extended Vacations (15+ days)';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(post);
    });
    return groups;
  }, [filtered, groupBy]);

  const handleCopy = (post: CommunityPost) => {
    cloneTrip(post.trip);
    setViewPost(null);
    showToast(`"${post.trip.name}" copied to My Trips.`, 'success');
  };

  const activeFilterCount = [
    selectedStyle !== 'All Styles',
    selectedDuration !== 'Any Duration',
    !!maxBudget.trim(),
  ].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">

      {/* ── Page header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={24} color="var(--color-primary)" />
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>VoyageIQ Community</h1>
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Discover journeys. Share experiences. Get inspired.
        </p>
      </div>

      {/* ── Community stats ticker */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem',
      }}>
        {[
          { icon: <Users size={18} color="#8b5cf6" />, value: '12,400+', label: 'Travelers' },
          { icon: <Globe size={18} color="#06b6d4" />, value: '3,200+', label: 'Public Trips' },
          { icon: <MapPin size={18} color="#f43f5e" />, value: '180+', label: 'Countries' },
          { icon: <TrendingUp size={18} color="#10b981" />, value: '94%', label: 'Satisfaction' },
        ].map(stat => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.9rem 1.1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color-light)' }}>
            {stat.icon}
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.25rem' }}>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search trips, destinations or travellers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem 0.6rem 2.4rem',
                fontSize: '0.875rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)', outline: 'none',
              }}
            />
            <Search size={15} color="var(--text-light)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '0.6rem 0.75rem', fontSize: '0.825rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minWidth: '150px' }}
          >
            {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {/* Group By */}
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as any)}
            style={{ padding: '0.6rem 0.75rem', fontSize: '0.825rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minWidth: '150px' }}
          >
            <option value="none">No Grouping</option>
            <option value="style">Travel Style</option>
            <option value="duration">Trip Duration</option>
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1rem',
              fontSize: '0.825rem', fontWeight: 700, borderRadius: 'var(--radius-md)',
              border: `1px solid ${activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--border-color)'}`,
              backgroundColor: activeFilterCount > 0 ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible filter row */}
        {showFilters && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color-light)' }} className="animate-fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: '130px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Travel Style</label>
              <select value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)}
                style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}>
                {TRAVEL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: '160px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</label>
              <select value={selectedDuration} onChange={e => setSelectedDuration(e.target.value)}
                style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}>
                {DURATION_BUCKETS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: '130px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Total Spend ($)</label>
              <input type="number" min={0} value={maxBudget} onChange={e => setMaxBudget(e.target.value)} placeholder="e.g. 3000"
                style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setSelectedStyle('All Styles'); setSelectedDuration('Any Duration'); setMaxBudget(''); }}
                style={{ alignSelf: 'flex-end', padding: '0.45rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filtered.length} {filtered.length === 1 ? 'journey' : 'journeys'} found
          {searchTerm && ` for "${searchTerm}"`}
        </span>
        {(searchTerm || activeFilterCount > 0) && (
          <button
            onClick={() => { setSearchTerm(''); setSelectedStyle('All Styles'); setSelectedDuration('Any Duration'); setMaxBudget(''); }}
            style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            Clear all filters
          </button>
        )}
      </div>

      {/* ── Card Grid */}
      {filtered.length > 0 ? (
        groupBy === 'none' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(post => (
              <CommunityCard
                key={post.id}
                post={post}
                onLike={() => likeCommunityPost(post.id)}
                onView={() => {
                  setSharedTripId(post.trip.id);
                  setCurrentView('shared-trip');
                }}
                onCopy={() => handleCopy(post)}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {Object.entries(grouped || {}).map(([groupName, items]) => (
              <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color-light)', paddingBottom: '6px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {groupName}
                  </h2>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 700 }}>
                    {items.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
                  {items.map(post => (
                    <CommunityCard
                      key={post.id}
                      post={post}
                      onLike={() => likeCommunityPost(post.id)}
                      onView={() => {
                        setSharedTripId(post.trip.id);
                        setCurrentView('shared-trip');
                      }}
                      onCopy={() => handleCopy(post)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={{
          padding: '5rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-color-light)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        }}>
          <Compass size={40} color="var(--text-light)" />
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>No trips found</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Try adjusting your search or clearing filters to discover more journeys.
          </p>
        </div>
      )}

      {/* ── Read-only trip detail modal */}
      {viewPost && (
        <TripDetailModal
          post={viewPost}
          onClose={() => setViewPost(null)}
          onCopy={() => handleCopy(viewPost)}
        />
      )}

    </div>
  );
};
