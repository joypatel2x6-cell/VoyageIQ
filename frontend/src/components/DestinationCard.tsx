import React from 'react';
import type { DestinationSuggestion } from '../data/mockData';
import { Star, Plus } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface DestinationCardProps {
  destination: DestinationSuggestion;
  onViewDetails: (dest: DestinationSuggestion) => void;
  onAddToTrip: (dest: DestinationSuggestion) => void;
}

const bestForMap: Record<string, string[]> = {
  'Kyoto, Japan': ['Culture', 'Food', 'Nature'],
  'Amalfi Coast, Italy': ['Coastal', 'Food', 'Culture'],
  'Swiss Alps, Switzerland': ['Nature', 'Adventure'],
  'Reykjavik, Iceland': ['Adventure', 'Nature'],
  'New York City, USA': ['Urban', 'Shopping', 'Food', 'Culture'],
};

export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  onViewDetails,
  onAddToTrip
}) => {
  const costIndex = destination.dailyBudgetEstimate <= 150 ? '$$' : destination.dailyBudgetEstimate <= 230 ? '$$$' : '$$$$';
  const bestFor = bestForMap[destination.name] || ['Adventure'];

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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xl), var(--shadow-premium)';
        const img = e.currentTarget.querySelector('img');
        if (img) img.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        const img = e.currentTarget.querySelector('img');
        if (img) img.style.transform = 'scale(1)';
      }}
    >
      {/* Photo header */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '62%', overflow: 'hidden' }}>
        <img
          src={destination.image}
          alt={destination.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';
          }}
        />

        {/* Bottom gradient for text */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(11,19,41,0.88))' }} />

        {/* Category Badge overlay */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
          <Badge variant="info">
            {destination.category}
          </Badge>
        </div>

        {/* Rating overlay */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 2,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            color: 'var(--text-on-dark)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          <Star size={12} fill="var(--color-accent-warm)" color="var(--color-accent-warm)" />
          {destination.rating}
        </div>

        {/* City name + country on the image */}
        <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', zIndex: 2, color: '#ffffff' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.15, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {destination.name.split(',')[0]}
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '1px', fontWeight: 500 }}>
            {destination.name.split(',').slice(1).join(',').trim() || 'World Destination'}
          </div>
        </div>
      </div>

      {/* Info content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {destination.name}
            </h3>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Best season: {destination.bestSeason.split(' (')[0]}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>
            {costIndex}
          </span>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.45', flex: 1, margin: 0 }}>
          {destination.description}
        </p>

        {/* Best For Tags Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
          {bestFor.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.675rem',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Cost & Parameter footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color-light)',
            marginTop: '0.25rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Est. Daily Cost</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              ₹{(destination.dailyBudgetEstimate * 85).toLocaleString()}/day
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(destination)}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            >
              Details
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAddToTrip(destination)}
              leftIcon={<Plus size={13} />}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              Add Stop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
