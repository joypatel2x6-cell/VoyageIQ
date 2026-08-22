import React from 'react';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  style,
  ...props
}) => {
  const pickerId = id || `date-${Math.random().toString(36).substring(2, 9)}`;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  const pickerStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.9rem',
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
    <div style={containerStyle} className={`datepicker-container ${className}`}>
      {label && (
        <label
          htmlFor={pickerId}
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}
      <input
        type="date"
        id={pickerId}
        style={pickerStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-error)',
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
