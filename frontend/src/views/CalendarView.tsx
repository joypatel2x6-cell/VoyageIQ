import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Trip, Activity } from '../data/mockData';
import {
  ChevronLeft, ChevronRight, CalendarDays, LayoutList,
  Wallet, MapPin, ChevronDown, ChevronUp,
  Plus, Trash2, Edit3, GripVertical, X, Check,
  Sparkles, Circle
} from 'lucide-react';
import { Button } from '../components/ui/Button';

// ─────────────────────────────────────────────────────────────────────────────
//  Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TRIP_PALETTE = [
  { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#818cf8' },
  { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#fb923c' },
  { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#34d399' },
  { bg: 'rgba(236,72,153,0.15)', border: '#ec4899', text: '#f472b6' },
  { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fbbf24' },
  { bg: 'rgba(6,182,212,0.15)', border: '#06b6d4', text: '#22d3ee' },
];

const CAT_COLORS: Record<string, string> = {
  food: '#f43f5e',
  transport: '#06b6d4',
  accommodation: '#8b5cf6',
  activity: '#10b981',
  culture: '#6d28d9',
  adventure: '#f97316',
  shopping: '#ec4899',
  entertainment: '#eab308',
  nature: '#22c55e',
  other: '#64748b',
  sightseeing: '#10b981',
};

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function shortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function isBetween(d: string, start: string, end: string) {
  return d >= start && d <= end;
}

function getDaysInMonth(month: number, year: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const lastDay     = new Date(year, month + 1, 0).getDate();
  const prevLast    = new Date(year, month, 0).getDate();
  const cells: { day: number; dateStr: string; current: boolean }[] = [];

  // previous month padding
  for (let i = firstWeekday; i > 0; i--) {
    const d   = prevLast - i + 1;
    const m   = month === 0 ? 11 : month - 1;
    const y   = month === 0 ? year - 1 : year;
    cells.push({ day: d, dateStr: toDateStr(y, m, d - 1), current: false });
  }
  // current month
  for (let i = 1; i <= lastDay; i++) {
    cells.push({ day: i, dateStr: toDateStr(year, month, i - 1), current: true });
  }
  // next month padding to fill 42 cells
  for (let i = 1; cells.length < 42; i++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ day: i, dateStr: toDateStr(y, m, i - 1), current: false });
  }
  return cells;
}

// Build a list of all trip dates with their activities
function buildDayMap(trips: Trip[]) {
  const map: Record<string, { trip: Trip; activities: Activity[]; cityName: string }[]> = {};
  trips.forEach(trip => {
    trip.destinations.forEach(dest => {
      // mark all days in this city stop
      const start = new Date(dest.arrivalDate);
      const end   = new Date(dest.departureDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        // find existing entry for this trip
        const existing = map[key].find(e => e.trip.id === trip.id);
        if (!existing) {
          const dayActivities = dest.activities.filter(a => a.date === key);
          map[key].push({ trip, activities: dayActivities, cityName: dest.name });
        } else {
          existing.activities.push(...dest.activities.filter(a => a.date === key));
        }
      }
    });
  });
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-component: Add/Edit Activity Modal
// ─────────────────────────────────────────────────────────────────────────────
interface EditModalProps {
  tripId: string;
  cityId: string;
  date: string;
  existing?: Activity;
  onSave: (data: Omit<Activity, 'id'>) => void;
  onClose: () => void;
}

const ActivityEditModal: React.FC<EditModalProps> = ({ date, existing, onSave, onClose }) => {
  const [title, setTitle]       = useState(existing?.title || '');
  const [time, setTime]         = useState(existing?.time || '09:00');
  const [cost, setCost]         = useState(String(existing?.cost ?? 0));
  const [cat, setCat]           = useState<Activity['category']>(existing?.category || 'activity');
  const [location, setLocation] = useState(existing?.location || '');
  const [notes, setNotes]       = useState(existing?.notes || '');

  const cats: Activity['category'][] = [
    'activity', 'food', 'transport', 'accommodation',
    'culture', 'adventure', 'shopping', 'entertainment', 'other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), time, cost: Number(cost) || 0, category: cat, location, notes, date });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,19,41,0.75)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', animation: 'modal-scale 0.22s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{existing ? 'Edit Activity' : 'Add Activity'}</h3>
          <button onClick={onClose} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Activity Name *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Eiffel Tower Visit"
              style={{ padding: '0.55rem 0.8rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>

          {/* Date shown (read-only) */}
          <div style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color-light)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            📅 {dateLabel(date)}
          </div>

          {/* Time + Cost */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{ padding: '0.5rem 0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Cost (₹)</label>
              <input type="number" min={0} value={cost} onChange={e => setCost(e.target.value)} placeholder="0"
                style={{ padding: '0.5rem 0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>

          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Category</label>
            <select value={cat} onChange={e => setCat(e.target.value as Activity['category'])}
              style={{ padding: '0.5rem 0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}>
              {cats.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Champ de Mars, Paris"
              style={{ padding: '0.55rem 0.8rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any tips or reminders..."
              style={{ padding: '0.55rem 0.8rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <Button variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<Check size={14} />}>
              {existing ? 'Save Changes' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-component: Timeline View
// ─────────────────────────────────────────────────────────────────────────────
const TimelineView: React.FC<{
  trips: Trip[];
  activeTripId: string | null;
  onSetActiveTrip: (id: string) => void;
}> = ({ trips, activeTripId, onSetActiveTrip }) => {
  const { addActivity, removeActivity } = useApp();
  const [collapsedDays, setCollapsedDays]     = useState<Set<string>>(new Set());
  const [editingModal, setEditingModal]       = useState<{ tripId: string; cityId: string; date: string; act?: Activity } | null>(null);

  const activeTrip = trips.find(t => t.id === activeTripId) || trips[0];

  if (!activeTrip) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <CalendarDays size={40} color="var(--text-light)" style={{ marginBottom: 8 }} />
        <p>No trips to display. Create your first trip to get started.</p>
      </div>
    );
  }

  // Build ordered list of trip dates
  const allDates: { dateStr: string; cityId: string; cityName: string; cityImage: string; activities: Activity[] }[] = [];
  const start = new Date(activeTrip.startDate);
  const end   = new Date(activeTrip.endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    // Find which city stop covers this date
    const cityStop = activeTrip.destinations.find(dest =>
      isBetween(dateStr, dest.arrivalDate, dest.departureDate)
    );
    if (cityStop) {
      const dayActivities = cityStop.activities
        .filter(a => a.date === dateStr)
        .sort((a, b) => a.time.localeCompare(b.time));
      allDates.push({
        dateStr,
        cityId: cityStop.id,
        cityName: cityStop.name,
        cityImage: cityStop.image,
        activities: dayActivities,
      });
    }
  }

  const toggleDay = (d: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  };

  const handleDeleteActivity = (cityId: string, actId: string) => {
    removeActivity(activeTrip.id, cityId, actId);
  };

  const handleSaveActivity = (tripId: string, cityId: string, _date: string, data: Omit<Activity, 'id'>) => {
    addActivity(tripId, cityId, data);
    setEditingModal(null);
  };

  const totalCost = activeTrip.destinations.reduce(
    (s, d) => s + d.activities.reduce((ss, a) => ss + a.cost, 0), 0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Trip selector + summary */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {trips.map((t, i) => (
            <button key={t.id}
              onClick={() => onSetActiveTrip(t.id)}
              style={{
                padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                border: `2px solid ${t.id === activeTripId ? TRIP_PALETTE[i % TRIP_PALETTE.length].border : 'var(--border-color)'}`,
                backgroundColor: t.id === activeTripId ? TRIP_PALETTE[i % TRIP_PALETTE.length].bg : 'transparent',
                color: t.id === activeTripId ? TRIP_PALETTE[i % TRIP_PALETTE.length].text : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {t.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>{shortDate(activeTrip.startDate)} → {shortDate(activeTrip.endDate)}</span>
          <span>·</span>
          <span>{activeTrip.destinations.length} cities</span>
          <span>·</span>
          <span>Total ₹{totalCost.toLocaleString()}</span>
        </div>
      </div>

      {/* Day-by-day timeline */}
      {allDates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-color-light)', color: 'var(--text-muted)' }}>
          <p>No day data found for this trip. Check that destination dates overlap with the trip range.</p>
        </div>
      ) : (
        allDates.map((day, dayIdx) => {
          const isCollapsed  = collapsedDays.has(day.dateStr);
          const dailyCost    = day.activities.reduce((s, a) => s + a.cost, 0);
          const dayNumber    = dayIdx + 1;
          const isFirstOfCity = dayIdx === 0 || allDates[dayIdx - 1].cityId !== day.cityId;

          return (
            <div key={day.dateStr} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* City label on first day of a stop */}
              {isFirstOfCity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--color-primary)' }}>
                    <img src={day.cityImage} alt={day.cityName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City Stop</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color="var(--color-primary)" /> {day.cityName}
                    </div>
                  </div>
                </div>
              )}

              {/* Day block */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', overflow: 'hidden', marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>

                {/* Day header — clickable to collapse */}
                <button
                  onClick={() => toggleDay(day.dateStr)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color-light)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                      {dayNumber}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {new Date(day.dateStr).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', gap: 10, marginTop: 2 }}>
                        <span>{day.activities.length} activities</span>
                        {dailyCost > 0 && <span>· ₹{dailyCost.toLocaleString()} daily spend</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {dailyCost > 0 && (
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ₹{dailyCost.toLocaleString()}
                      </span>
                    )}
                    {isCollapsed ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronUp size={18} color="var(--text-muted)" />}
                  </div>
                </button>

                {/* Activity list */}
                {!isCollapsed && (
                  <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {day.activities.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Sparkles size={20} color="var(--text-light)" style={{ marginBottom: 6 }} />
                        <p style={{ margin: 0 }}>No activities scheduled. Add one below.</p>
                      </div>
                    ) : (
                      day.activities.map((act) => (
                        <div key={act.id}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0.8rem 1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', borderLeft: `3px solid ${CAT_COLORS[act.category] || '#64748b'}`, position: 'relative', transition: 'background-color 0.2s' }}
                        >
                          {/* Reorder grip */}
                          <div style={{ color: 'var(--text-light)', paddingTop: 2, cursor: 'grab', flexShrink: 0 }}>
                            <GripVertical size={14} />
                          </div>

                          {/* Time column */}
                          <div style={{ minWidth: 48, flexShrink: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{act.time}</div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: 2, color: CAT_COLORS[act.category] || '#64748b', backgroundColor: (CAT_COLORS[act.category] || '#64748b') + '22', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', display: 'inline-block' }}>
                              {act.category}
                            </div>
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{act.title}</div>
                            {act.location && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{act.location}</div>}
                            {act.notes && <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 3, fontStyle: 'italic' }}>{act.notes}</div>}
                          </div>

                          {/* Cost */}
                          {act.cost > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', flexShrink: 0 }}>
                              <Wallet size={12} color="var(--text-muted)" />
                              ₹{act.cost.toLocaleString()}
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={() => setEditingModal({ tripId: activeTrip.id, cityId: day.cityId, date: day.dateStr, act })}
                              style={{ width: 26, height: 26, border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                              title="Edit activity"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(day.cityId, act.id)}
                              style={{ width: 26, height: 26, border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                              title="Delete activity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Add activity button */}
                    <button
                      onClick={() => setEditingModal({ tripId: activeTrip.id, cityId: day.cityId, date: day.dateStr })}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', transition: 'all 0.2s', width: '100%', marginTop: 4 }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <Plus size={14} /> Add Activity
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Edit / Add Modal */}
      {editingModal && (
        <ActivityEditModal
          tripId={editingModal.tripId}
          cityId={editingModal.cityId}
          date={editingModal.date}
          existing={editingModal.act}
          onSave={(data) => handleSaveActivity(editingModal.tripId, editingModal.cityId, editingModal.date, data)}
          onClose={() => setEditingModal(null)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-component: Calendar View
// ─────────────────────────────────────────────────────────────────────────────
const MonthCalendar: React.FC<{
  trips: Trip[];
  onOpenTrip: (tripId: string) => void;
}> = ({ trips, onOpenTrip }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear]   = useState(today.getFullYear());
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const cells   = useMemo(() => getDaysInMonth(month, year), [month, year]);
  const dayMap  = useMemo(() => buildDayMap(trips), [trips]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const jumpToToday = () => { setMonth(today.getMonth()); setYear(today.getFullYear()); };

  // Assign a color index to each trip
  const tripColorMap = useMemo(() => {
    const map: Record<string, number> = {};
    trips.forEach((t, i) => { map[t.id] = i % TRIP_PALETTE.length; });
    return map;
  }, [trips]);

  // Trip spans for a cell: get unique trips active on a date
  const getCellTrips = (dateStr: string) =>
    trips.filter(t => isBetween(dateStr, t.startDate, t.endDate));

  const todayStr = today.toISOString().split('T')[0];
  const selectedData = selectedCell ? dayMap[selectedCell] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="cal-outer">
      <style>{`
        @media (min-width: 1024px) {
          .cal-outer { grid-template-columns: 3fr 1.1fr !important; }
        }
        @media (max-width: 640px) {
          .cal-day-grid { grid-auto-rows: 68px !important; font-size: 0.7rem; }
          .cal-event-pill { font-size: 0.55rem !important; }
        }
      `}</style>

      {/* Monthly Grid */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Controls row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{MONTHS[month]} {year}</h3>
            <button onClick={jumpToToday}
              style={{ padding: '3px 10px', fontSize: '0.725rem', fontWeight: 700, borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Today
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ icon: <ChevronLeft size={16} />, fn: prevMonth }, { icon: <ChevronRight size={16} />, fn: nextMonth }].map((btn, i) => (
              <button key={i} onClick={btn.fn}
                style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}>
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color-light)' }}>
          {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
        </div>

        {/* Day cells */}
        <div
          className="cal-day-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '90px', gap: '1px', backgroundColor: 'var(--border-color-light)', border: '1px solid var(--border-color-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
        >
          {cells.map((cell, idx) => {
            const cellTrips = getCellTrips(cell.dateStr);
            const isToday   = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedCell;
            const actCount  = dayMap[cell.dateStr]?.reduce((s, e) => s + e.activities.length, 0) || 0;

            return (
              <div
                key={idx}
                onClick={() => setSelectedCell(cell.dateStr === selectedCell ? null : cell.dateStr)}
                style={{
                  backgroundColor: isSelected ? 'rgba(99,102,241,0.08)' : cell.current ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  padding: '6px 7px',
                  display: 'flex', flexDirection: 'column', gap: 3,
                  opacity: cell.current ? 1 : 0.4,
                  cursor: cellTrips.length > 0 || cell.current ? 'pointer' : 'default',
                  outline: isSelected ? '2px solid var(--color-primary)' : 'none',
                  outlineOffset: -2,
                  overflow: 'hidden',
                  transition: 'background-color 0.15s',
                }}
              >
                {/* Day number */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: isToday ? 800 : 600,
                  backgroundColor: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday ? '#fff' : cell.current ? 'var(--text-primary)' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {cell.day}
                </div>

                {/* Trip event pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 }}>
                  {cellTrips.slice(0, 2).map(trip => {
                    const pal = TRIP_PALETTE[tripColorMap[trip.id] ?? 0];
                    const isStart = cell.dateStr === trip.startDate;
                    return (
                      <div
                        key={trip.id}
                        className="cal-event-pill"
                        onClick={e => { e.stopPropagation(); onOpenTrip(trip.id); }}
                        style={{
                          fontSize: '0.6rem', fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: isStart ? '3px 3px 3px 3px' : '0 3px 3px 0',
                          backgroundColor: pal.bg,
                          color: pal.text,
                          borderLeft: isStart ? `3px solid ${pal.border}` : 'none',
                          marginLeft: isStart ? 0 : -7,
                          paddingLeft: isStart ? 5 : 9,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          cursor: 'pointer',
                        }}
                        title={trip.name}
                      >
                        {isStart ? trip.name : ''}
                      </div>
                    );
                  })}
                  {cellTrips.length > 2 && (
                    <span style={{ fontSize: '0.575rem', color: 'var(--text-muted)', fontWeight: 600, paddingLeft: 3 }}>+{cellTrips.length - 2} more</span>
                  )}
                  {actCount > 0 && cellTrips.length <= 2 && (
                    <span style={{ fontSize: '0.575rem', color: 'var(--text-light)', paddingLeft: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Circle size={5} fill="var(--color-primary)" color="var(--color-primary)" /> {actCount} act.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Legend */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trip Legend</h4>
          {trips.map((t, i) => {
            const pal = TRIP_PALETTE[i % TRIP_PALETTE.length];
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onOpenTrip(t.id)}>
                <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: pal.border, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{shortDate(t.startDate)} → {shortDate(t.endDate)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected-day details */}
        {selectedCell && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-primary)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'modal-scale 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {new Date(selectedCell).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              <button onClick={() => setSelectedCell(null)} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {selectedData && selectedData.length > 0 ? (
              selectedData.map(entry => (
                <div key={entry.trip.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {entry.trip.name} · {entry.cityName}
                  </div>
                  {entry.activities.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>No activities on this date.</p>
                  ) : (
                    entry.activities
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(act => (
                        <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${CAT_COLORS[act.category] || '#64748b'}` }}>
                          <div style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-secondary)', minWidth: 38 }}>{act.time}</div>
                          <div style={{ flex: 1, fontSize: '0.775rem', fontWeight: 700 }}>{act.title}</div>
                          {act.cost > 0 && <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>₹{act.cost.toLocaleString()}</div>}
                        </div>
                      ))
                  )}
                </div>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>No trips or activities on this date.</p>
            )}
          </div>
        )}

        {/* Stats card */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Stats</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Trips</span>
              <span style={{ fontWeight: 800 }}>{trips.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Activities</span>
              <span style={{ fontWeight: 800 }}>
                {trips.reduce((s, t) => s + t.destinations.reduce((ss, d) => ss + d.activities.length, 0), 0)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cities Planned</span>
              <span style={{ fontWeight: 800 }}>
                {trips.reduce((s, t) => s + t.destinations.length, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main Export: CalendarView
// ─────────────────────────────────────────────────────────────────────────────
export const CalendarView: React.FC = () => {
  const { trips, activeTripId, setActiveTripId, setCurrentView } = useApp();
  const [mode, setMode] = useState<'calendar' | 'timeline'>('calendar');
  const [timelineTrip, setTimelineTrip] = useState<string | null>(activeTripId || trips[0]?.id || null);

  const handleOpenTrip = (tripId: string) => {
    setActiveTripId(tripId);
    setCurrentView('trip-summary');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>Trip Calendar</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Visualise, manage, and plan every day of your journey.
          </p>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', borderRadius: 'var(--radius-lg)', padding: 4, gap: 4 }}>
          {([
            { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
            { id: 'timeline', label: 'Timeline', Icon: LayoutList },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 700,
                borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                backgroundColor: mode === tab.id ? 'var(--color-primary)' : 'transparent',
                color: mode === tab.id ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              <tab.Icon size={15} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* View content */}
      {mode === 'calendar' ? (
        <MonthCalendar trips={trips} onOpenTrip={handleOpenTrip} />
      ) : (
        <TimelineView
          trips={trips}
          activeTripId={timelineTrip}
          onSetActiveTrip={setTimelineTrip}
        />
      )}
    </div>
  );
};
