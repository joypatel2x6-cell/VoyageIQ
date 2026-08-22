import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  User, Mail, Phone, MapPin, Globe, Lock, Bell, Shield,
  Trash2, Camera, Check, ChevronDown, ChevronRight,
  Eye, EyeOff, Languages, Bookmark, Sparkles, Award,
  Compass, Flame, Plane, Heart, Calendar, LogOut, Save, X,
  CheckCircle2, AlertTriangle, ShieldCheck, Zap
} from 'lucide-react';

// ── Types & Mock Data ──────────────────────────────────────────────────────────
type ProfileTab = 'personal' | 'preferences' | 'saved' | 'achievements' | 'security';
type TravelPref = 'Adventure' | 'Culture' | 'Food & Dining' | 'Nature' | 'Shopping' | 'Luxury' | 'Budget Travel';
type TravelStyle = 'Budget' | 'Balanced' | 'Luxury';

const PREFS: TravelPref[] = ['Adventure', 'Culture', 'Food & Dining', 'Nature', 'Shopping', 'Luxury', 'Budget Travel'];
const PREF_ICONS: Record<TravelPref, string> = {
  Adventure: '🧗', Culture: '🏛️', 'Food & Dining': '🍜', Nature: '🌿',
  Shopping: '🛍️', Luxury: '💎', 'Budget Travel': '💰',
};
const LANGUAGES = ['English', 'Hindi', 'French', 'Spanish', 'German', 'Japanese', 'Arabic', 'Portuguese', 'Italian'];

const INITIAL_SAVED_DESTINATIONS = [
  { id: '1', name: 'Santorini', country: 'Greece', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop', category: 'Romantic & Scenic', rating: 4.9 },
  { id: '2', name: 'Kyoto', country: 'Japan', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop', category: 'Culture & Temples', rating: 4.8 },
  { id: '3', name: 'Amalfi Coast', country: 'Italy', image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=600&auto=format&fit=crop', category: 'Coastal Luxury', rating: 4.9 },
  { id: '4', name: 'Norwegian Fjords', country: 'Norway', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop', category: 'Nature & Hiking', rating: 4.7 },
];

const ACHIEVEMENTS = [
  { id: '1', title: 'Globe Trotter', desc: 'Explored destinations in 3+ continents', icon: '🌍', progress: 100, unlocked: true },
  { id: '2', title: 'Culture Vulture', desc: 'Added 15+ museum and heritage stops', icon: '🏛️', progress: 85, unlocked: true },
  { id: '3', title: 'Budget Mastermind', desc: 'Saved 20%+ on trip itineraries using AI', icon: '⚡', progress: 100, unlocked: true },
  { id: '4', title: 'Community Pioneer', desc: 'Shared 5 public trip plans with community', icon: '🌟', progress: 60, unlocked: false },
];

export const Profile: React.FC = () => {
  const { showToast, logoutUser, setCurrentView, currentUser, updateUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  // Form State
  const [avatar, setAvatar]     = useState(currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
  const [firstName, setFirst]   = useState(currentUser.firstName || 'Ayush');
  const [lastName, setLast]     = useState(currentUser.lastName || 'Patel');
  const [email, setEmail]       = useState(currentUser.email || 'ayush@example.com');
  const [phone, setPhone]       = useState(currentUser.phone || '+91 98765 43210');
  const [city, setCity]         = useState(currentUser.city || 'Mumbai');
  const [country, setCountry]   = useState(currentUser.country || 'India');
  const [bio, setBio]           = useState('Passionate explorer chasing sunsets, street food, and hidden gems around the world. 🌍✨');
  const [language, setLanguage] = useState(currentUser.language || 'English');
  const [travelStyle, setStyle] = useState<TravelStyle>((currentUser.travelStyle as TravelStyle) || 'Balanced');
  const [prefs, setPrefs]       = useState<TravelPref[]>((currentUser.preferences as TravelPref[]) || ['Adventure', 'Culture', 'Food & Dining']);
  const [savedDests, setSaved]  = useState(INITIAL_SAVED_DESTINATIONS);

  // Errors & Loading
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);

  // Security & Password State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [pwErrors, setPwErrors]   = useState<Record<string, string>>({});

  // Notifications State
  const [notifEmail, setNotifEmail]     = useState(true);
  const [notifPush, setNotifPush]       = useState(true);
  const [notifTripReminders, setRemind] = useState(true);
  const [notifCommunity, setComm]       = useState(true);
  const [notifDeals, setDeals]          = useState(false);

  // Privacy State
  const [profilePublic, setPublic] = useState(true);
  const [showTrips, setShowTrips]  = useState(true);

  // Delete Dialog
  const [showDelete, setShowDelete] = useState(false);

  // Handlers
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatar(dataUrl);
      updateUser({ avatarUrl: dataUrl });
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
    return errs;
  };

  const handleSave = () => {
    const errs = validateProfile();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast('Please check the form for errors.', 'error');
      return;
    }
    setErrors({});
    setSaving(true);
    setTimeout(() => {
      updateUser({
        firstName,
        lastName,
        email,
        phone,
        city,
        country,
        avatarUrl: avatar,
        preferences: prefs,
        travelStyle,
        language,
      });
      setSaving(false);
      showToast('Profile updated successfully!', 'success');
    }, 800);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPw) errs.currentPw = 'Current password is required';
    if (!newPw || newPw.length < 6) errs.newPw = 'Must be at least 6 characters';
    if (newPw !== confirmPw) errs.confirmPw = 'Passwords do not match';
    if (Object.keys(errs).length > 0) {
      setPwErrors(errs);
      return;
    }
    setPwErrors({});
    showToast('Password updated successfully!', 'success');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const handleDeleteAccount = () => {
    setShowDelete(false);
    showToast('Account scheduled for deletion. Logging out...', 'warning');
    setTimeout(() => logoutUser(), 1500);
  };

  const togglePref = (p: TravelPref) => {
    setPrefs((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const removeSaved = (id: string) => {
    setSaved((prev) => prev.filter((d) => d.id !== id));
    showToast('Destination removed from wishlist', 'info');
  };

  // Password strength helper
  const getPwStrength = (p: string) => {
    if (!p) return { pct: 0, label: '', color: 'transparent' };
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 2) return { pct: 33, label: 'Weak', color: '#f87171' };
    if (s <= 4) return { pct: 66, label: 'Medium', color: '#fbbf24' };
    return { pct: 100, label: 'Strong', color: '#34d399' };
  };

  const pwStrength = getPwStrength(newPw);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* ── 1. HERO PROFILE BANNER ── */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '24px',
          border: '1px solid var(--border-color-light)',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
      >
        {/* Animated Banner Header */}
        <div
          style={{
            height: '170px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #db2777 80%, #06b6d4 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <Sparkles size={14} color="#f43f5e" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>PRO VOYAGER</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('explore')}
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', backdropFilter: 'blur(6px)' }}
              leftIcon={<Compass size={14} />}
            >
              Explore Cities
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              leftIcon={saving ? undefined : <Save size={14} />}
              style={{ backgroundColor: '#ffffff', color: '#4f46e5', fontWeight: 800 }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>

        {/* Profile Details Container */}
        <div style={{ padding: '0 2rem 2rem', marginTop: '-60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
            
            {/* Avatar & Main Identity */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '5px solid var(--bg-secondary)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-tertiary)',
                    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
                    position: 'relative',
                  }}
                >
                  <img src={avatar} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button
                  onClick={handleAvatarClick}
                  title="Upload profile photo"
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    border: '3px solid var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <Camera size={15} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {firstName} {lastName}
                  </h1>
                  <ShieldCheck size={22} color="#10b981" title="Verified Account" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} /> {email}</span>
                  {city && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {city}, {country}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                    Active Traveller
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stat Counters */}
            <div style={{ display: 'flex', gap: '1.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.85rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border-color-light)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary)' }}>14</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Trips Planned</span>
              </div>
              <div style={{ width: 1, backgroundColor: 'var(--border-color-light)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{savedDests.length}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Saved Cities</span>
              </div>
              <div style={{ width: 1, backgroundColor: 'var(--border-color-light)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b' }}>8</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Countries</span>
              </div>
            </div>

          </div>

          {/* Bio Snippet */}
          <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '750px', margin: '1.25rem 0 0 0' }}>
            {bio}
          </p>
        </div>

        {/* ── 2. INTERACTIVE TAB NAVIGATION BAR ── */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border-color-light)', backgroundColor: 'var(--bg-primary)', overflowX: 'auto' }}>
          {[
            { id: 'personal', label: 'Personal Info', icon: <User size={16} /> },
            { id: 'preferences', label: 'Travel Preferences', icon: <Heart size={16} /> },
            { id: 'saved', label: 'Saved Wishlist (' + savedDests.length + ')', icon: <Bookmark size={16} /> },
            { id: 'achievements', label: 'Badges & Stats', icon: <Award size={16} /> },
            { id: 'security', label: 'Security & Account', icon: <Lock size={16} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '1rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. TAB CONTENT PANELS ── */}

      {/* TAB 1: PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Personal Information</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Manage your basic profile info and contact details.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirst(e.target.value)}
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: errors.firstName ? '1px solid var(--color-error)' : '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
              {errors.firstName && <span style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}>{errors.firstName}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLast(e.target.value)}
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: errors.lastName ? '1px solid var(--color-error)' : '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
              {errors.lastName && <span style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}>{errors.lastName}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: errors.email ? '1px solid var(--color-error)' : '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
              {errors.email && <span style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}>{errors.email}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bio & Travel Persona</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Tell the VoyageIQ community about yourself..."
              style={{ padding: '0.75rem', fontSize: '0.875rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'none' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>{bio.length}/200</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="primary" onClick={handleSave} disabled={saving} leftIcon={<Save size={15} />}>
              {saving ? 'Saving...' : 'Save Personal Info'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: TRAVEL PREFERENCES */}
      {activeTab === 'preferences' && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Travel Style & Interests</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>VoyageIQ AI uses these preferences to tailor personalized itinerary suggestions.</p>
          </div>

          {/* Travel Style Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Budget & Travel Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { type: 'Budget', icon: '💰', title: 'Budget Explorer', desc: 'Hostels, local transport, street food' },
                { type: 'Balanced', icon: '⚖️', title: 'Balanced Traveller', desc: 'Boutique stays, mixed dining, top sights' },
                { type: 'Luxury', icon: '💎', title: 'Luxury Voyager', desc: '5-star hotels, private tours, fine dining' },
              ].map((style) => {
                const active = travelStyle === style.type;
                return (
                  <div
                    key={style.type}
                    onClick={() => setStyle(style.type as TravelStyle)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: active ? '2px solid var(--color-primary)' : '1px solid var(--border-color-light)',
                      backgroundColor: active ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>{style.icon}</span>
                      {active && <CheckCircle2 size={18} color="var(--color-primary)" />}
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: active ? 'var(--color-primary)' : 'var(--text-primary)' }}>{style.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{style.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interests Tiles */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Activity Interests</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {PREFS.map((p) => {
                const active = prefs.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePref(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      borderRadius: '25px',
                      border: active ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      backgroundColor: active ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-primary)',
                      color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{PREF_ICONS[p]}</span>
                    <span>{p}</span>
                    {active && <Check size={14} color="var(--color-primary)" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Preferred App & Guide Language
            </label>
            <div style={{ position: 'relative', maxWidth: '300px' }}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 2.25rem 0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', appearance: 'none' }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED DESTINATIONS */}
      {activeTab === 'saved' && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Saved Wishlist Destinations</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Cities and regions you saved for future travel planning.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentView('explore')} leftIcon={<Compass size={14} />}>
              Discover Cities
            </Button>
          </div>

          {savedDests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Bookmark size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Your wishlist is empty</h4>
              <p style={{ margin: '6px 0 1rem 0', fontSize: '0.85rem' }}>Explore world destinations and click the bookmark button to save them here.</p>
              <Button variant="primary" onClick={() => setCurrentView('explore')}>Explore Cities</Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {savedDests.map((dest) => (
                <div
                  key={dest.id}
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color-light)',
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <div style={{ height: '130px', position: 'relative' }}>
                    <img src={dest.image} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => removeSaved(dest.id)}
                      title="Remove from wishlist"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>
                    <span style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '0.675rem', fontWeight: 800, backgroundColor: 'rgba(99, 102, 241, 0.9)', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
                      ⭐ {dest.rating}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{dest.name}, {dest.country}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dest.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACHIEVEMENTS & STATS */}
      {activeTab === 'achievements' && (
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Travel Badges & Milestones</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Unlock achievements as you plan, save, and explore with VoyageIQ.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: ach.unlocked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  opacity: ach.unlocked ? 1 : 0.75,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>{ach.icon}</span>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: ach.unlocked ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                      color: ach.unlocked ? '#10b981' : 'var(--text-muted)',
                    }}
                  >
                    {ach.unlocked ? 'UNLOCKED' : 'IN PROGRESS'}
                  </span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{ach.title}</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ach.desc}</p>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <span>Progress</span>
                    <span>{ach.progress}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: ach.progress + '%', backgroundColor: ach.unlocked ? '#10b981' : 'var(--color-primary)', borderRadius: '10px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & ACCOUNT */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Change Password Card */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Change Password</h3>
            </div>

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCur ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: pwErrors.currentPw ? '1px solid var(--color-error)' : '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <button type="button" onClick={() => setShowCur(!showCur)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwErrors.currentPw && <span style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}>{pwErrors.currentPw}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: pwErrors.newPw ? '1px solid var(--color-error)' : '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwErrors.newPw && <span style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}>{pwErrors.newPw}</span>}
              </div>

              {/* Password strength bar */}
              {newPw && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pwStrength.pct + '%', backgroundColor: pwStrength.color, transition: 'all 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: pwStrength.color, fontWeight: 700 }}>Strength: {pwStrength.label}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConf ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '10px', border: pwErrors.confirmPw ? '1px solid var(--color-error)' : '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <button type="button" onClick={() => setShowConf(!showConf)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwErrors.confirmPw && <span style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}>{pwErrors.confirmPw}</span>}
              </div>

              <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start', marginTop: '6px' }}>Update Password</Button>
            </form>
          </div>

          {/* Delete Danger Zone */}
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '20px', padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f87171' }}>Delete Account</h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Permanently remove your profile, trips, and saved preferences.</p>
            </div>
            <Button variant="danger" onClick={() => setShowDelete(true)}>Delete Account</Button>
          </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDelete}
        title="Delete VoyageIQ Account?"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your saved trips."
        confirmLabel="Yes, Delete Permanently"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDelete(false)}
      />

    </div>
  );
};
