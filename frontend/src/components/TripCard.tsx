import React, { useState } from 'react';
import type { Trip } from '../data/mockData';
import { Calendar, Users, Trash2, Edit3, ArrowRight, Eye, Share2, Copy } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ConfirmationDialog } from './ui/ConfirmationDialog';

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  INR: '₹',
};

interface TripCardProps {
  trip: Trip;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate?: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onView,
  onDelete,
  onEdit,
  onDuplicate
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  // Compute total expenses from all activities
  const totalCost = trip.destinations.reduce(
    (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
    0
  );

  const budgetPercent = Math.min(Math.round((totalCost / trip.budgetLimit) * 100), 100);
  const isOverBudget = totalCost > trip.budgetLimit;
  const symbol = currencySymbols[trip.currency || 'USD'] || '$';

  const getDurationInDays = () => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  };
  const duration = getDurationInDays();

  // Format dates: YYYY-MM-DD to "Oct 15, 2026"
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Get status badge
  const getStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (today > end) return <Badge variant="neutral">Completed</Badge>;
    if (today >= start && today <= end) return <Badge variant="success">Active Now</Badge>;
    return <Badge variant="info">Upcoming</Badge>;
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color-light)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      {/* Visual cover from first destination or fallback */}
      <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
        <img
          src={trip.destinations[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800'}
          alt={trip.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(11, 19, 41, 0.2), rgba(11, 19, 41, 0.75))',
          }}
        />

        {/* Status overlay */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
          {getStatus()}
        </div>

        {/* Shared badge overlay */}
        {trip.isShared && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
            <Badge variant="secondary">
              <Share2 size={10} style={{ marginRight: '3px' }} /> Shared
            </Badge>
          </div>
        )}

        {/* Name and description overlay */}
        <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', zIndex: 2, color: 'var(--text-on-dark)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.name}
          </h3>
          <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.description}
          </p>
        </div>
      </div>

      {/* Main Info */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
        {/* Date Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
          <Calendar size={14} color="var(--text-light)" />
          <span>{formatDate(trip.startDate)}</span>
          <ArrowRight size={12} color="var(--text-light)" />
          <span>{formatDate(trip.endDate)}</span>
        </div>

        {/* Metas Row: Duration, Stops, Travelers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
            {duration} Day{duration !== 1 ? 's' : ''}
          </span>
          <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
            {trip.destinations.length} Stop{trip.destinations.length !== 1 ? 's' : ''}
          </span>
          <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
            {trip.travelersCount || 1} Traveler{(trip.travelersCount || 1) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Destinations Multi-City Route */}
        {trip.destinations.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            {trip.destinations.map((dest, idx) => (
              <React.Fragment key={dest.id}>
                {idx > 0 && <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>→</span>}
                <span
                  style={{
                    fontSize: '0.775rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {dest.name.split(',')[0]}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Budget Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Budget Spent</span>
            <span style={{ color: isOverBudget ? 'var(--color-error)' : 'var(--color-success)' }}>
              {symbol}{totalCost.toLocaleString()} / {symbol}{trip.budgetLimit.toLocaleString()}
            </span>
          </div>

          {/* Budget progress bar */}
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${budgetPercent}%`,
                height: '100%',
                backgroundColor: isOverBudget ? 'var(--color-error)' : 'var(--color-success)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Footer actions / collaborators */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color-light)',
            paddingTop: '0.75rem',
            marginTop: '0.25rem',
          }}
        >
          {/* Collaborator Avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {trip.collaborators.length > 0 ? (
              <div style={{ display: 'flex', marginRight: '6px' }}>
                {trip.collaborators.slice(0, 3).map((col, idx) => (
                  <img
                    key={idx}
                    src={col.avatar}
                    alt={col.name}
                    title={col.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '2px solid var(--bg-secondary)',
                      marginLeft: idx > 0 ? '-8px' : 0,
                      objectFit: 'cover',
                    }}
                  />
                ))}
                {trip.collaborators.length > 3 && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-secondary)',
                      marginLeft: '-8px',
                    }}
                  >
                    +{trip.collaborators.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Users size={12} /> Personal
              </span>
            )}
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(trip.id)}
              title="Edit Itinerary"
              style={{ padding: '4px 8px' }}
            >
              <Edit3 size={15} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicate && onDuplicate(trip)}
              title="Duplicate Trip"
              style={{ padding: '4px 8px' }}
            >
              <Copy size={15} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onView(trip.id)}
              title="View Summary"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            >
              <Eye size={14} style={{ marginRight: '4px' }} /> View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowConfirm(true)}
              title="Delete Trip"
              style={{ padding: '4px 8px', color: 'var(--color-error)' }}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => onDelete(trip.id)}
        title="Delete Trip"
        message={`Are you sure you want to delete "${trip.name}"? This action will permanently remove all destinations, activities, and budget tracking.`}
      />
    </div>
  );
};
