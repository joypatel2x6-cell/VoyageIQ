import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import {
  User, Mail, Phone, MapPin, Globe, Lock, Bell, Shield,
  Trash2, Camera, Check, ChevronDown, ChevronRight,
  AlertTriangle, Eye, EyeOff, Languages, Bookmark,
  LogOut, Save, X, Heart
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type TravelPref = 'Adventure' | 'Culture' | 'Food & Dining' | 'Nature' | 'Shopping' | 'Luxury' | 'Budget Travel';
type TravelStyle = 'Budget' | 'Balanced' | 'Luxury';

const PREFS: TravelPref[] = ['Adventure', 'Culture', 'Food & Dining', 'Nature', 'Shopping', 'Luxury', 'Budget Travel'];
const PREF_ICONS: Record<TravelPref, string> = {
  Adventure: '🧗', Culture: '🏛️', 'Food & Dining': '🍜', Nature: '🌿',
  Shopping: '🛍️', Luxury: '💎', 'Budget Travel': '💰',
};
const LANGUAGES = ['English', 'Hindi', 'French', 'Spanish', 'German', 'Japanese', 'Arabic', 'Portuguese', 'Italian'];
const SAVED_DESTINATIONS = [
  { name: 'Santorini, Greece', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=400&auto=format&fit=crop' },
  { name: 'Kyoto, Japan', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=400&auto=format&fit=crop' },
  { name: 'Amalfi Coast, Italy', image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=400&auto=format&fit=crop' },
  { name: 'Norwegian Fjords', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop' },
];

// ── Helper: Section Card ───────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', overflow: 'hidden' }}>
    <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-color-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h2>
    </div>
    <div style={{ padding: '1.5rem' }}>{children}</div>
  </div>
);

// ── Helper: Form Field ────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; error?: string; readOnly?: boolean;
  suffix?: React.ReactNode;
}> = ({ label, value, onChange, type = 'text', placeholder, error, readOnly, suffix }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: '100%',
          padding: suffix ? '0.6rem 2.8rem 0.6rem 0.875rem' : '0.6rem 0.875rem',
          fontSize: '0.875rem',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--border-color)'}`,
          backgroundColor: readOnly ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
          color: readOnly ? 'var(--text-muted)' : 'var(--text-primary)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {suffix && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{suffix}</div>}
    </div>
    {error && <span style={{ fontSize: '0.725rem', color: 'var(--color-error)', fontWeight: 600 }}>{error}</span>}
  </div>
);

// ── Delete Confirmation Dialog ─────────────────────────────────────────────────
const DeleteDialog: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,19,41,0.8)', backdropFilter: 'blur(8px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={onCancel}>
    <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'modal-scale 0.22s cubic-bezier(0.34,1.56,0.64,1)' }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={26} color="var(--color-error)" />
        </div>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Delete Account?</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          This action is <strong>permanent and irreversible</strong>. All your trips, itineraries, and saved data will be permanently deleted.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Button variant="outline" onClick={onCancel} style={{ flex: 1 }}>Cancel</Button>
        <button
          onClick={onConfirm}
          style={{ flex: 1, padding: '0.6rem', fontSize: '0.875rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--color-error)', color: '#fff', cursor: 'pointer' }}
        >
          Yes, Delete Account
        </button>
      </div>
    </div>
  </div>
);

// ── Main Profile Page ──────────────────────────────────────────────────────────
export const Profile: React.FC = () => {
  const { showToast, logoutUser, setCurrentView } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [avatar, setAvatar]     = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
  const [firstName, setFirst]   = useState('Ayush');
  const [lastName, setLast]     = useState('Patel');
  const [email, setEmail]       = useState('ayush@voyageiq.com');
  const [phone, setPhone]       = useState('+91 98765 43210');
  const [city, setCity]         = useState('Mumbai');
  const [country, setCountry]   = useState('India');
  const [bio, setBio]           = useState('Passionate explorer chasing sunsets, street food, and hidden gems around the world. 🌍');
  const [language, setLanguage] = useState('English');
  const [travelStyle, setStyle] = useState<TravelStyle>('Balanced');
  const [prefs, setPrefs]       = useState<TravelPref[]>(['Adventure', 'Food & Dining', 'Culture']);
  const [savedDests, setSaved]  = useState(SAVED_DESTINATIONS);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password change state
  const [pwSection, setPwSection]   = useState(false);
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showCur, setShowCur]       = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [pwErrors, setPwErrors]     = useState<Record<string, string>>({});

  // Notifications state
  const [notifSection, setNotifSection] = useState(false);
  const [notifEmail, setNotifEmail]     = useState(true);
  const [notifPush, setNotifPush]       = useState(true);
  const [notifTripReminders, setRemind] = useState(true);
  const [notifCommunity, setComm]       = useState(false);
  const [notifDeals, setDeals]          = useState(true);

  // Privacy state
  const [privSection, setPrivSection] = useState(false);
  const [profilePublic, setPublic]    = useState(true);
  const [showTrips, setShowTrips]     = useState(true);

  // Delete dialog
  const [showDelete, setShowDelete] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatar(ev.target?.result as string);
      showToast('Profile photo updated!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (phone && !/^[\d\s()+-]{7,20}$/.test(phone)) errs.phone = 'Enter a valid phone number';
    return errs;
  };

  const handleSave = () => {
    const errs = validateProfile();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast('Please fix the errors before saving.', 'error');
      return;
    }
    setErrors({});
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Profile saved successfully!', 'success');
    }, 1000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPw) errs.currentPw = 'Current password is required';
    if (!newPw || newPw.length < 6) errs.newPw = 'New password must be at least 6 characters';
    if (newPw !== confirmPw) errs.confirmPw = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
    setPwErrors({});
    showToast('Password changed successfully!', 'success');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwSection(false);
  };

  const handleDeleteAccount = () => {
    setShowDelete(false);
    showToast('Account deletion scheduled. You will be logged out.', 'warning');
    setTimeout(() => logoutUser(), 1500);
  };

  const togglePref = (p: TravelPref) =>
    setPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const removeSaved = (name: string) =>
    setSaved(prev => prev.filter(d => d.name !== name));

  // ── Password strength ────────────────────────────────────────────────────────
  const pwStrength = (p: string) => {
    if (!p) return { pct: 0, label: '', color: 'transparent' };
    let s = 0;
    if (p.length >= 6) s++; if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 2) return { pct: 33, label: 'Weak', color: 'var(--color-error)' };
    if (s <= 4) return { pct: 66, label: 'Fair', color: 'var(--color-warning)' };
    return { pct: 100, label: 'Strong', color: 'var(--color-success)' };
  };
  const strength = pwStrength(newPw);

  // ── Toggle switch component ──────────────────────────────────────────────────
  const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }> = ({ on, onChange, label, sub }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0', borderBottom: '1px solid var(--border-color-light)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!on)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          backgroundColor: on ? 'var(--color-primary)' : 'var(--bg-tertiary)',
          position: 'relative', transition: 'background-color 0.25s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: on ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
          transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }} />
      </button>
    </div>
  );

  // ── Collapsible account setting row ─────────────────────────────────────────
  const AccRow: React.FC<{ icon: React.ReactNode; label: string; sub: string; open: boolean; onToggle: () => void; color?: string; children?: React.ReactNode }> = ({ icon, label, sub, open, onToggle, color = 'var(--color-primary)', children }) => (
    <div style={{ border: '1px solid var(--border-color-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.25rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
        </div>
        {open ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
      </button>
      {open && <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border-color-light)' }}>{children}</div>}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '860px', margin: '0 auto' }} className="animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>My Profile</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your personal information, preferences, and account settings.</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving} leftIcon={saving ? undefined : <Save size={15} />}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {/* ── Avatar + Hero card ───────────────────────────────────────────────── */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', overflow: 'hidden' }}>
        {/* Cover gradient */}
        <div style={{ height: 130, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
        </div>

        <div style={{ padding: '0 2rem 1.75rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', marginTop: -52, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', border: '4px solid var(--bg-secondary)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)' }}>
              <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <button
              onClick={handleAvatarClick}
              style={{ position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--color-primary)', border: '2px solid var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              title="Change profile photo"
            >
              <Camera size={13} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 800 }}>{firstName} {lastName}</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} />{email}</span>
              {city && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{city}, {country}</span>}
              {phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{phone}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {prefs.map(p => (
                <span key={p} style={{ fontSize: '0.675rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(99,102,241,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {PREF_ICONS[p]} {p}
                </span>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            <Button variant="outline" size="sm" leftIcon={<LogOut size={13} />} onClick={logoutUser}>Sign Out</Button>
          </div>
        </div>
      </div>

      {/* ── Personal Info ────────────────────────────────────────────────────── */}
      <Section title="Personal Information" icon={<User size={18} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <Field label="First Name" value={firstName} onChange={setFirst} placeholder="Ayush" error={errors.firstName} />
          <Field label="Last Name" value={lastName} onChange={setLast} placeholder="Patel" error={errors.lastName} />
          <Field label="Email Address" value={email} onChange={setEmail} type="email" placeholder="you@email.com" error={errors.email} />
          <Field label="Phone Number" value={phone} onChange={setPhone} type="tel" placeholder="+91 98765 43210" error={errors.phone} />
          <Field label="City" value={city} onChange={setCity} placeholder="Mumbai" />
          <Field label="Country" value={country} onChange={setCountry} placeholder="India" />
        </div>

        {/* Bio */}
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Short Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={2}
            maxLength={180}
            placeholder="Tell the community a bit about yourself..."
            style={{ padding: '0.65rem 0.875rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>{bio.length}/180</span>
        </div>
      </Section>

      {/* ── Travel Preferences ───────────────────────────────────────────────── */}
      <Section title="Travel Preferences" icon={<Heart size={18} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Travel style */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>Travel Style</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['Budget', 'Balanced', 'Luxury'] as TravelStyle[]).map(s => (
                <button key={s} onClick={() => setStyle(s)}
                  style={{
                    padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700,
                    borderRadius: 'var(--radius-full)', border: `2px solid ${s === travelStyle ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    backgroundColor: s === travelStyle ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: s === travelStyle ? 'var(--color-primary)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  {s === 'Budget' ? '💰' : s === 'Balanced' ? '⚖️' : '✨'} {s}
                </button>
              ))}
            </div>
          </div>

          {/* Interest tiles */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>Interests</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PREFS.map(p => {
                const active = prefs.includes(p);
                return (
                  <button key={p} onClick={() => togglePref(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '0.5rem 1rem', fontSize: '0.825rem', fontWeight: 700,
                      borderRadius: 'var(--radius-full)',
                      border: `2px solid ${active ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      backgroundColor: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {active && <Check size={12} />}
                    {PREF_ICONS[p]} {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
              <Languages size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Preferred Language
            </label>
            <div style={{ position: 'relative', maxWidth: 260 }}>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 2.2rem 0.6rem 0.875rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', appearance: 'none' }}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Saved Destinations ───────────────────────────────────────────────── */}
      <Section title="Saved Destinations" icon={<Bookmark size={18} />}>
        {savedDests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Globe size={32} color="var(--text-light)" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>No saved destinations yet. Explore to save cities.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {savedDests.map(d => (
              <div key={d.name} style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 110, cursor: 'pointer' }}
                className="card-hover">
                <img src={d.image} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(11,19,41,0.8))' }} />
                <div style={{ position: 'absolute', bottom: 8, left: 10, right: 30, color: '#fff', fontSize: '0.775rem', fontWeight: 700, lineHeight: 1.3 }}>{d.name}</div>
                <button
                  onClick={() => removeSaved(d.name)}
                  style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(11,19,41,0.6)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Account Settings ─────────────────────────────────────────────────── */}
      <Section title="Account Settings" icon={<Shield size={18} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Change Password */}
          <AccRow
            icon={<Lock size={17} />} label="Change Password" open={pwSection} onToggle={() => setPwSection(v => !v)}
            sub="Update your account password" color="#8b5cf6"
          >
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {[
                { label: 'Current Password', val: currentPw, set: setCurrentPw, show: showCur, toggle: () => setShowCur(v => !v), err: pwErrors.currentPw },
                { label: 'New Password', val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(v => !v), err: pwErrors.newPw },
                { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, show: showConf, toggle: () => setShowConf(v => !v), err: pwErrors.confirmPw },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={f.show ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 2.8rem 0.6rem 0.875rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: `1px solid ${f.err ? 'var(--color-error)' : 'var(--border-color)'}`, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                    <button type="button" onClick={f.toggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {f.show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {f.err && <span style={{ fontSize: '0.725rem', color: 'var(--color-error)', fontWeight: 600 }}>{f.err}</span>}
                </div>
              ))}

              {/* Strength bar */}
              {newPw && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ height: 4, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, backgroundColor: strength.color, borderRadius: 'var(--radius-full)', transition: 'all 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                </div>
              )}

              <Button variant="primary" size="sm" type="submit" style={{ alignSelf: 'flex-end' }}>Update Password</Button>
            </form>
          </AccRow>

          {/* Notifications */}
          <AccRow
            icon={<Bell size={17} />} label="Notification Preferences" open={notifSection} onToggle={() => setNotifSection(v => !v)}
            sub="Manage how VoyageIQ contacts you" color="#06b6d4"
          >
            <div style={{ marginTop: '0.75rem' }}>
              <Toggle on={notifEmail} onChange={setNotifEmail} label="Email Notifications" sub="Receive updates and summaries via email" />
              <Toggle on={notifPush} onChange={setNotifPush} label="Push Notifications" sub="Browser push alerts for real-time updates" />
              <Toggle on={notifTripReminders} onChange={setRemind} label="Trip Reminders" sub="Alerts before your upcoming trips" />
              <Toggle on={notifCommunity} onChange={setComm} label="Community Activity" sub="Likes and comments on your shared itineraries" />
              <Toggle on={notifDeals} onChange={setDeals} label="Travel Deals & Offers" sub="Curated deals matching your travel style" />
            </div>
          </AccRow>

          {/* Privacy */}
          <AccRow
            icon={<Globe size={17} />} label="Privacy Settings" open={privSection} onToggle={() => setPrivSection(v => !v)}
            sub="Control your public profile visibility" color="#10b981"
          >
            <div style={{ marginTop: '0.75rem' }}>
              <Toggle on={profilePublic} onChange={setPublic} label="Public Profile" sub="Allow other travellers to discover your profile" />
              <Toggle on={showTrips} onChange={setShowTrips} label="Show My Trips Publicly" sub="Display shared trips in Community feed" />
            </div>
          </AccRow>

          {/* Delete Account */}
          <div style={{ border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', backgroundColor: 'rgba(239,68,68,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={17} color="var(--color-error)" />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-error)' }}>Delete Account</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Permanently delete your account and all associated data</div>
              </div>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-error)', backgroundColor: 'transparent', color: 'var(--color-error)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-error)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-error)'; }}
            >
              Delete Account
            </button>
          </div>

        </div>
      </Section>

      {/* ── Bottom Save bar ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingBottom: '2rem' }}>
        <Button variant="outline" onClick={() => setCurrentView('dashboard')}>Discard Changes</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} leftIcon={saving ? undefined : <Save size={15} />}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      {showDelete && <DeleteDialog onConfirm={handleDeleteAccount} onCancel={() => setShowDelete(false)} />}

    </div>
  );
};
