import React from 'react';
import type { Activity } from '../data/mockData';
import { ActivityCard } from './ActivityCard';

interface TimelineItemProps {
  activity: Activity;
  isLast?: boolean;
  onDelete?: () => void;
  currencySymbol?: string;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  activity,
  isLast = false,
  onDelete,
  currencySymbol
}) => {
  const getDotColor = () => {
    switch (activity.category) {
      case 'culture': return '#8b5cf6'; // Purple
      case 'transport': return '#06b6d4'; // Cyan
      case 'food': return '#f43f5e'; // Rose
      case 'shopping': return '#ec4899'; // Pink
      case 'sightseeing': return '#10b981'; // Emerald
      case 'adventure': return '#f97316'; // Orange
      case 'entertainment': return '#6d28d9'; // Violet
      case 'other':
      default:
        return '#64748b'; // Slate
    }
  };

  return (
    <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
      {/* Vertical line and dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        {/* Dot */}
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getDotColor(),
            border: '3px solid var(--bg-secondary)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 2,
            marginTop: '20px',
          }}
        />
        {/* Vertical track line */}
        {!isLast && (
          <div
            style={{
              width: '2px',
              flex: 1,
              backgroundColor: 'var(--border-color-light)',
              zIndex: 1,
              marginTop: '4px',
              marginBottom: '-16px', // overlap into next item
            }}
          />
        )}
      </div>

      {/* Time and Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, paddingBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {activity.time}
        </span>
        <ActivityCard activity={activity} onDelete={onDelete} currencySymbol={currencySymbol} />
      </div>
    </div>
  );
};
