import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm, onCancel,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        backgroundColor: 'rgba(11,19,41,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
          padding: '1.75rem', maxWidth: 400, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color-light)',
        }}
        onClick={e => e.stopPropagation()}
        className="animate-fade-in"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              backgroundColor: danger ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={18} color={danger ? '#ef4444' : '#f59e0b'} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          <button onClick={onCancel} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--text-light)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.65rem', fontSize: '0.875rem', fontWeight: 700,
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
              backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.65rem', fontSize: '0.875rem', fontWeight: 800,
              borderRadius: 'var(--radius-md)', border: 'none',
              backgroundColor: danger ? '#ef4444' : 'var(--color-primary)',
              color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
