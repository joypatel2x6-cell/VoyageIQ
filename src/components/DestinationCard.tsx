import React from 'react';
import type { DestinationSuggestion } from '../data/mockData';
import { Star, CloudSun, DollarSign, Plus } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface DestinationCardProps {
  destination: DestinationSuggestion;
  onAddTrip: (name: string) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  onAddTrip
}) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-color-light)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-md)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
  };

  const imageWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    paddingTop: '60%', // 5:3 Aspect Ratio
    overflow: 'hidden',
  };

  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  };

  const infoStyle: React.CSSProperties = {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    flex: 1,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = 'var(--shadow-xl), var(--shadow-premium)';
    const img = e.currentTarget.querySelector('img');
    if (img) img.style.transform = 'scale(1.05)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    const img = e.currentTarget.querySelector('img');
    if (img) img.style.transform = 'scale(1)';
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Photo header */}
      <div style={imageWrapperStyle}>
        <img
          src={destination.image}
          alt={destination.name}
          style={imageStyle}
        />
        {/* Category Badge overlay */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
          <Badge variant={destination.category === 'Adventure' ? 'warning' : destination.category === 'Coastal' ? 'secondary' : 'info'}>
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
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
      </div>

      {/* Info content */}
      <div style={infoStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {destination.name}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Best: {destination.bestSeason}
          </span>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4', flex: 1 }}>
          {destination.description}
        </p>

        {/* Parameters footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color-light)',
            marginTop: '0.4rem',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <CloudSun size={14} color="var(--text-muted)" />
              <span>{destination.weatherTemp}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <DollarSign size={14} color="var(--text-muted)" />
              <span>{destination.dailyBudgetEstimate}/day</span>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onAddTrip(destination.name);
            }}
            leftIcon={<Plus size={14} />}
            style={{ padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
          >
            Plan
          </Button>
        </div>
      </div>
    </div>
  );
};
