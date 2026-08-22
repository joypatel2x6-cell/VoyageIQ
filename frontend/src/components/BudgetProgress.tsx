import React from 'react';
import { Badge } from './ui/Badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetProgressProps {
  totalSpent: number;
  budgetLimit: number;
  currencySymbol?: string;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  totalSpent,
  budgetLimit,
  currencySymbol = '$'
}) => {
  const percent = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const isOver = totalSpent > budgetLimit;
  const remaining = budgetLimit - totalSpent;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trip Budget Health
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {currencySymbol}{totalSpent.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              spent of {currencySymbol}{budgetLimit.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          {isOver ? (
            <Badge variant="error">
              <AlertCircle size={12} style={{ marginRight: '4px' }} /> Over Budget
            </Badge>
          ) : (
            <Badge variant="success">
              <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> On Track
            </Badge>
          )}
        </div>
      </div>

      {/* Main progress bar */}
      <div
        style={{
          width: '100%',
          height: '10px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          position: 'relative',
         }}
      >
        <div
          style={{
            width: `${Math.min(percent, 100)}%`,
            height: '100%',
            backgroundColor: isOver ? 'var(--color-error)' : percent > 85 ? 'var(--color-warning)' : 'var(--color-success)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Remaining counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
        <span>{Math.round(percent)}% utilized</span>
        {isOver ? (
          <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>
            Exceeded by {currencySymbol}{Math.abs(remaining).toLocaleString()}
          </span>
        ) : (
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            {currencySymbol}{remaining.toLocaleString()} remaining
          </span>
        )}
      </div>
    </div>
  );
};
