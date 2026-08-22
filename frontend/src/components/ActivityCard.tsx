import React from 'react';
import type { Activity } from '../data/mockData';
import { Plane, Utensils, MapPin, Compass, ShoppingBag, Tag, Trash2, Clock, Flame, Palette, Music } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  onDelete?: () => void;
  currencySymbol?: string;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onDelete,
  currencySymbol = '$'
}) => {
  const getCategoryIcon = () => {
    const size = 16;
    switch (activity.category) {
      case 'sightseeing':
        return <Compass size={size} color="#10b981" />; // emerald
      case 'transport':
        return <Plane size={size} color="#06b6d4" />; // cyan
      case 'food':
        return <Utensils size={size} color="#f43f5e" />; // rose
      case 'shopping':
        return <ShoppingBag size={size} color="#ec4899" />; // pink
      case 'adventure':
        return <Flame size={size} color="#f97316" />; // orange
      case 'culture':
        return <Palette size={size} color="#8b5cf6" />; // purple
      case 'entertainment':
        return <Music size={size} color="#6d28d9" />; // violet
      case 'other':
      default:
        return <Tag size={size} color="#64748b" />; // slate
    }
  };

  const getCategoryColor = () => {
    switch (activity.category) {
      case 'sightseeing': return '#d1fae5';
      case 'transport': return '#ecfeff';
      case 'food': return '#ffe4e6';
      case 'shopping': return '#fce7f3';
      case 'adventure': return '#ffedd5';
      case 'culture': return '#f3e8ff';
      case 'entertainment': return '#ede9fe';
      case 'other':
      default:
        return '#f1f5f9';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color-light)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color-light)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Category Icon Badge */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: getCategoryColor(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {getCategoryIcon()}
      </div>

      {/* Info Group */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activity.title}
          </h4>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
            {activity.cost > 0 ? `${currencySymbol}${activity.cost.toLocaleString()}` : 'Free'}
          </span>
        </div>

        {/* Time and location */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)', fontSize: '0.775rem' }}>
            <Clock size={12} color="var(--text-light)" />
            <span>{activity.time}</span>
          </div>
          {activity.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.775rem', minWidth: 0 }}>
              <MapPin size={12} color="var(--text-light)" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activity.location}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {activity.notes && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '2px 0 0', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            "{activity.notes}"
          </p>
        )}
      </div>

      {/* Delete trigger */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-light)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-error-light)';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-light)';
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};
