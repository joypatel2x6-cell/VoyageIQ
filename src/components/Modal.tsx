import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    animation: 'fadeIn 0.2s ease-out forwards',
  };

  const getWidth = () => {
    switch (size) {
      case 'sm': return '400px';
      case 'lg': return '800px';
      case 'xl': return '1100px';
      case 'md':
      default:
        return '600px';
    }
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    width: 'calc(100% - 32px)',
    maxWidth: getWidth(),
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid var(--border-color)',
    animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    overflow: 'hidden',
  };

  return (
    <div style={backdropStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={contentStyle}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color-light)',
          }}
        >
          <h2
            style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              padding: '6px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-muted)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
