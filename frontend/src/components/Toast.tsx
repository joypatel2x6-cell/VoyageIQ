import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '400px',
    width: 'calc(100vw - 40px)',
  };

  const getToastStyle = (type: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      color: 'var(--text-primary)',
      fontSize: '0.9rem',
      fontWeight: 500,
      backdropFilter: 'blur(8px)',
      border: '1px solid',
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    };

    switch (type) {
      case 'success':
        return {
          ...base,
          backgroundColor: 'rgba(209, 250, 229, 0.95)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
        };
      case 'warning':
        return {
          ...base,
          backgroundColor: 'rgba(254, 243, 199, 0.95)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
        };
      case 'error':
        return {
          ...base,
          backgroundColor: 'rgba(254, 226, 226, 0.95)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
        };
      case 'info':
      default:
        return {
          ...base,
          backgroundColor: 'rgba(224, 242, 254, 0.95)',
          borderColor: 'rgba(2, 132, 199, 0.3)',
        };
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#10b981" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'error':
        return <XCircle size={18} color="#ef4444" />;
      case 'info':
      default:
        return <Info size={18} color="#0284c7" />;
    }
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {toasts.map((toast) => (
        <div key={toast.id} style={getToastStyle(toast.type)}>
          <div style={{ marginTop: '2px', display: 'flex', flexShrink: 0 }}>
            {getIcon(toast.type)}
          </div>
          <div style={{ flex: 1, wordBreak: 'break-word', lineHeight: '1.4' }}>
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              display: 'flex',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
