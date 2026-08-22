import React, { useState } from 'react';
import { useApp, type ViewType } from '../context/AppContext';
import {
  LayoutDashboard, Map, CalendarPlus, Compass, Share2,
  Calendar, Sparkles, UserCircle2, BrainCircuit,
  LogOut, Shield, ChevronRight,
} from 'lucide-react';

interface NavItem {
  view: ViewType;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

type NavGroup = {
  groupLabel?: string;
  items: NavItem[];
};

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentUser, unreadCount, logoutUser } = useApp();
  const [showAdminHint, setShowAdminHint] = useState(false);

  const navGroups: NavGroup[] = [
    {
      items: [
        { view: 'dashboard',    label: 'Dashboard',       icon: <LayoutDashboard size={19} /> },
        { view: 'my-trips',     label: 'My Trips',        icon: <Map size={19} /> },
        { view: 'plan-trip',    label: 'Plan Trip',       icon: <CalendarPlus size={19} /> },
      ],
    },
    {
      groupLabel: 'Discover',
      items: [
        { view: 'explore',      label: 'Explore',         icon: <Compass size={19} /> },
        { view: 'things-to-do', label: 'Things to Do',    icon: <Sparkles size={19} /> },
        { view: 'community',    label: 'Community',       icon: <Share2 size={19} /> },
      ],
    },
    {
      groupLabel: 'Manage',
      items: [
        { view: 'calendar',     label: 'Calendar',        icon: <Calendar size={19} /> },
        { view: 'insights',     label: 'Smart Insights',  icon: <BrainCircuit size={19} /> },
        { view: 'profile',      label: 'My Profile',      icon: <UserCircle2 size={19} /> },
      ],
    },
  ];

  const isActive = (view: ViewType) => currentView === view;

  const itemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 11, padding: '0.6rem 0.9rem',
    borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
    fontWeight: active ? 700 : 500,
    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
    backgroundColor: active ? 'var(--color-primary)' : 'transparent',
    transition: 'all 0.18s ease', cursor: 'pointer', position: 'relative',
    userSelect: 'none',
  });

  const onHover = (e: React.MouseEvent<HTMLDivElement>, active: boolean) => {
    if (active) return;
    e.currentTarget.style.color = '#fff';
    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
    e.currentTarget.style.transform = 'translateX(3px)';
  };
  const offHover = (e: React.MouseEvent<HTMLDivElement>, active: boolean) => {
    if (active) return;
    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.transform = 'none';
  };

  return (
    <aside
      className="desktop-sidebar"
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 'var(--sidebar-width)', backgroundColor: 'var(--bg-dark-accent)',
        color: 'var(--text-on-dark)', display: 'flex', flexDirection: 'column',
        zIndex: 100, borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <style>{`
        @media (max-width: 1024px) { .desktop-sidebar { display: none !important; } }
      `}</style>

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        onClick={() => setCurrentView('dashboard')}
        style={{
          height: 'var(--navbar-height)', display: 'flex', alignItems: 'center',
          padding: '0 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
          gap: 10, cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 10, padding: 6, display: 'flex', flexShrink: 0 }}>
          <Compass size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>VoyageIQ</div>
          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', marginTop: -1 }}>Plan Smarter. Travel Further.</div>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.groupLabel && (
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.5rem', marginBottom: 4 }}>
                {group.groupLabel}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => {
                const active = isActive(item.view);
                return (
                  <div
                    key={item.view}
                    style={itemStyle(active)}
                    onClick={() => setCurrentView(item.view)}
                    onMouseEnter={e => onHover(e, active)}
                    onMouseLeave={e => offHover(e, active)}
                  >
                    <span style={{ display: 'flex', opacity: active ? 1 : 0.75 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {/* Notification badge for insights */}
                    {item.view === 'insights' && unreadCount > 0 && (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#ef4444',
                        color: '#fff', fontSize: '0.6rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Admin hint (discreet) ──────────────────────────────────────────── */}
      <div
        style={{ padding: '0 0.75rem 0.5rem' }}
        onMouseEnter={() => setShowAdminHint(true)}
        onMouseLeave={() => setShowAdminHint(false)}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)', cursor: 'default',
          opacity: showAdminHint ? 1 : 0.25, transition: 'opacity 0.3s',
        }}>
          <Shield size={13} color="rgba(255,255,255,0.5)" />
          {showAdminHint && (
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Admin: Press <kbd style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: '0.6rem' }}>Ctrl+Shift+A</kbd>
              <ChevronRight size={10} />
            </span>
          )}
        </div>
      </div>

      {/* ── User Footer ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.75rem' }}>
        <div
          onClick={() => setCurrentView('profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 0.75rem',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background-color 0.18s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.firstName}
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', color: '#fff', flexShrink: 0 }}>
              {currentUser.firstName[0]}{currentUser.lastName[0]}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.firstName} {currentUser.lastName}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.email}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); logoutUser(); }}
            title="Sign out"
            style={{ border: 'none', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
