import React from 'react';
import { Bed, Plane, Utensils, Compass, ShoppingBag, Tag, AlertTriangle, Flame, Palette, Music } from 'lucide-react';

interface BudgetCardProps {
  category: string;
  spent: number;
  limit?: number;
  percentage: number;
  currencySymbol?: string;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  category,
  spent,
  limit,
  percentage,
  currencySymbol = '$'
}) => {
  const getIcon = () => {
    const size = 18;
    switch (category) {
      case 'sightseeing': return <Compass size={size} color="#10b981" />;
      case 'transport': return <Plane size={size} color="#06b6d4" />;
      case 'food': return <Utensils size={size} color="#f43f5e" />;
      case 'adventure': return <Flame size={size} color="#f97316" />;
      case 'culture': return <Palette size={size} color="#8b5cf6" />;
      case 'shopping': return <ShoppingBag size={size} color="#ec4899" />;
      case 'entertainment': return <Music size={size} color="#6d28d9" />;
      case 'accommodation': return <Bed size={size} color="#8b5cf6" />;
      case 'total': return <Tag size={size} color="var(--color-primary)" />;
      default:
        return <Tag size={size} color="#64748b" />;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'sightseeing': return 'Sightseeing';
      case 'transport': return 'Transport';
      case 'food': return 'Food & Dining';
      case 'adventure': return 'Adventure';
      case 'culture': return 'Culture & Heritage';
      case 'shopping': return 'Shopping';
      case 'entertainment': return 'Entertainment';
      case 'accommodation': return 'Lodging';
      case 'total': return 'Total Budget';
      default:
        return 'Other Expenses';
    }
  };

  const isOver = percentage > 100;
  const barColor = isOver 
    ? 'var(--color-error)' 
    : percentage > 85 
      ? 'var(--color-warning)' 
      : 'var(--color-primary)';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color-light)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Category header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
            }}
          >
            {getIcon()}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {getCategoryLabel()}
          </span>
        </div>

        {isOver && (
          <div
            title="Exceeds Budget Limit!"
            style={{
              display: 'flex',
              color: 'var(--color-error)',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <AlertTriangle size={16} />
          </div>
        )}
      </div>

      {/* Figures */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {currencySymbol}{spent.toLocaleString()}
        </span>
        {limit !== undefined && (
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            of {currencySymbol}{limit.toLocaleString()} limit ({Math.round(percentage)}%)
          </span>
        )}
      </div>

      {/* Progress slider bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginTop: '4px',
        }}
      >
        <div
          style={{
            width: `${Math.min(percentage, 100)}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
};
