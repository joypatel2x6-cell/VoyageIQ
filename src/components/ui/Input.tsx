import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  leftIcon,
  className = '',
  id,
  style,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  };

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.9rem',
    paddingLeft: leftIcon ? '2.5rem' : '0.9rem',
    fontSize: '0.925rem',
    backgroundColor: 'var(--bg-secondary)',
    border: error ? '1px solid var(--color-error)' : '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-primary)';
    e.target.style.boxShadow = error 
      ? '0 0 0 3px var(--color-error-light)' 
      : '0 0 0 3px var(--color-primary-light)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--border-color)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={containerStyle} className={`input-container ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}

      <div style={inputWrapperStyle}>
        {leftIcon && (
          <div
            style={{
              position: 'absolute',
              left: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          style={inputBaseStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>

      {error ? (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-error)',
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      ) : helperText ? (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
