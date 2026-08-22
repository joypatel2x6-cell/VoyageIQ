import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width = '100%',
  height,
  className = '',
  count = 1,
}) => {
  const getRadius = () => {
    if (variant === 'circle') return '50%';
    if (variant === 'text') return 'var(--radius-xs)';
    return 'var(--radius-md)';
  };

  const defaultHeight = () => {
    if (variant === 'text') return '0.875rem';
    if (variant === 'circle') return '40px';
    return '150px';
  };

  const styles = (index: number): React.CSSProperties => ({
    display: 'block',
    width: typeof width === 'number' ? `${width}px` : width,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : defaultHeight(),
    backgroundColor: 'var(--border-color-light)',
    borderRadius: getRadius(),
    backgroundImage: 'linear-gradient(90deg, var(--border-color-light) 25%, var(--bg-tertiary) 50%, var(--border-color-light) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.6s infinite linear',
    marginBottom: count > 1 && index < count - 1 ? '0.5rem' : 0,
  });

  // Include dynamic keyframes directly using a simple style tag if needed, or rely on normal animation since we have index.css. 
  // Let's inject a small CSS animation dynamically so it works seamlessly.
  return (
    <>
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, idx) => (
        <span
          key={idx}
          style={styles(idx)}
          className={`skeleton skeleton-${variant} ${className}`}
        />
      ))}
    </>
  );
};
