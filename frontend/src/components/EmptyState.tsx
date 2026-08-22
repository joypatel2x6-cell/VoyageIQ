import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon, title, description, action, compact = false,
}) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: compact ? '2rem 1rem' : '4rem 2rem',
    backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
    border: '1px dashed var(--border-color-light)',
  }}>
    {icon && (
      <div style={{
        width: compact ? 48 : 64, height: compact ? 48 : 64,
        borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1rem', color: 'var(--text-muted)',
      }}>
        {icon}
      </div>
    )}
    <h3 style={{ margin: '0 0 6px', fontSize: compact ? '0.95rem' : '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
      {title}
    </h3>
    <p style={{ margin: '0 0 1.25rem', fontSize: compact ? '0.8rem' : '0.875rem', color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.55 }}>
      {description}
    </p>
    {action && (
      <button
        onClick={action.onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 700,
          borderRadius: 'var(--radius-md)', border: 'none',
          background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        {action.icon} {action.label}
      </button>
    )}
  </div>
);
