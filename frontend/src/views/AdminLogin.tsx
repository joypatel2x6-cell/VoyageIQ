import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle, Compass } from 'lucide-react';

const ADMIN_EMAIL    = 'admin@voyageiq.com';
const ADMIN_PASSWORD = 'admin@123';

interface AdminLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBack }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password)     { setError('Password is required.'); return; }

    setLoading(true);
    setTimeout(() => {
      if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(newAttempts >= 3
          ? 'Too many failed attempts. Contact your system administrator.'
          : 'Invalid admin credentials. Access denied.'
        );
      }
      setLoading(false);
    }, 900);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 60%)' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Card */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(239,68,68,0.2)', padding: '2.25rem', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(239,68,68,0.3)' }}>
              <Shield size={26} color="#fff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>Admin Access</h1>
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>VoyageIQ Analytics Dashboard — Restricted Area</p>
          </div>

          {/* Warning */}
          <div style={{ display: 'flex', gap: 8, padding: '0.75rem 0.9rem', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '1.5rem' }}>
            <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, lineHeight: 1.45 }}>
              This area is restricted to authorised administrators only. Unauthorised access is prohibited.
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@voyageiq.com" disabled={attempts >= 3}
                  style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter admin password" disabled={attempts >= 3}
                  style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 2.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: '0.775rem', color: '#ef4444', fontWeight: 600 }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading || attempts >= 3}
              style={{ padding: '0.75rem', fontSize: '0.925rem', fontWeight: 800, borderRadius: 'var(--radius-md)', border: 'none', background: attempts >= 3 ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', cursor: attempts >= 3 ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Authenticating…' : attempts >= 3 ? 'Access Locked' : 'Access Admin Panel'}
            </button>
          </form>

          {/* Divider + back */}
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color-light)' }} />
            <button onClick={onBack}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
              <Compass size={13} /> Back to VoyageIQ
            </button>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color-light)' }} />
          </div>

          {/* Hint */}
          <p style={{ margin: '1rem 0 0', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-light)' }}>
            Demo credentials: <strong style={{ color: 'var(--text-muted)' }}>admin@voyageiq.com</strong> / <strong style={{ color: 'var(--text-muted)' }}>admin@123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
