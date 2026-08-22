import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    gap: '0.5rem',
    border: '1px solid transparent',
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary-light)',
          color: 'var(--color-primary)',
          hover: { backgroundColor: 'var(--color-primary-light)' }
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          hover: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--text-light)' }
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          hover: { backgroundColor: 'var(--bg-tertiary)' }
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-error)',
          color: 'var(--text-on-primary)',
          hover: { backgroundColor: '#dc2626' } // darker red
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-success)',
          color: 'var(--text-on-primary)',
          hover: { backgroundColor: '#059669' } // darker green
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--text-on-primary)',
          hover: { backgroundColor: 'var(--color-primary-hover)', transform: 'translateY(-1px)' }
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.4rem 0.8rem',
          fontSize: '0.85rem',
        };
      case 'lg':
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
        };
      case 'md':
      default:
        return {
          padding: '0.55rem 1.1rem',
          fontSize: '0.925rem',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Combine styles inline for full Vanilla CSS modularity without Tailwind
  const styles = {
    ...baseStyle,
    ...variantStyles,
    ...sizeStyles,
    width: fullWidth ? '100%' : 'auto',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const target = e.currentTarget;
    if (variantStyles.hover) {
      Object.assign(target.style, variantStyles.hover);
    }
    if (variant === 'primary') {
      target.style.boxShadow = 'var(--shadow-premium)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const target = e.currentTarget;
    target.style.backgroundColor = variantStyles.backgroundColor || 'transparent';
    target.style.borderColor = variantStyles.border ? 'var(--border-color)' : 'transparent';
    target.style.transform = 'none';
    target.style.boxShadow = 'none';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(1px)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'none';
  };

  return (
    <button
      style={styles as React.CSSProperties}
      className={`btn-${variant} ${className}`}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
      {children}
      {rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
    </button>
  );
};
