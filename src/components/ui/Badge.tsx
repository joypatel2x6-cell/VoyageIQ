import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary-light)',
          color: 'var(--color-primary)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-success-light)',
          color: '#065f46', // dark green
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-accent-warm-light)',
          color: '#92400e', // dark amber
        };
      case 'error':
        return {
          backgroundColor: 'var(--color-error-light)',
          color: '#991b1b', // dark red
        };
      case 'info':
        return {
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary-hover)',
        };
      case 'neutral':
        return {
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--text-on-primary)',
        };
    }
  };

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.15rem 0.6rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-full)',
    lineHeight: '1.25',
    ...getStyles(),
  };

  return (
    <span style={style} className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};
