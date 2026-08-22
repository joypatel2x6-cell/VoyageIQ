import React, { useState, useEffect } from 'react';
import { useApp, type ViewType } from '../context/AppContext';
import { api } from '../services/api';
import { Compass, Search, Bell, LayoutDashboard, Map, CalendarPlus, Share2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentView, setCurrentView, isAuthenticated, currentUser } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from API when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) { setNotifications([]); setUnreadCount(0); return; }
    api.notifications.getNotifications({ limit: '10' })
      .then((res) => {
        if (res.success) {
          setNotifications(res.data || []);
          setUnreadCount(res.unreadCount || 0);
        }
      })
      .catch(() => { /* fail silently */ });
  }, [isAuthenticated]);

  // Simple view mapper to get title
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Travel Dashboard';
      case 'my-trips': return 'My Itineraries';
      case 'plan-trip': return 'Plan a New Journey';
      case 'explore': return 'Explore Destinations';
      case 'community': return 'Travel Community';
      case 'calendar': return 'Trip Calendar';
      case 'trip-summary': return 'Trip Overview';
      case 'things-to-do': return 'Discover Things To Do';
      case 'profile': return 'My Profile';
      case 'shared-trip': return 'Shared Trip Preview';
      case 'insights': return 'Smart Insights';
      default: return 'VoyageIQ';
    }
  };

  const navItemsMobile: { view: ViewType; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { view: 'my-trips', label: 'Trips', icon: <Map size={20} /> },
    { view: 'plan-trip', label: 'Plan', icon: <CalendarPlus size={20} /> },
    { view: 'explore', label: 'Explore', icon: <Compass size={20} /> },
    { view: 'community', label: 'Social', icon: <Share2 size={20} /> },
  ];

  return (
    <>
      {/* Top Header Navbar */}
      <header
        style={{
          height: 'var(--navbar-height)',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          boxShadow: 'var(--shadow-sm)',
        }}
        className="top-navbar"
      >
        <style>{`
          .mobile-logo { display: none !important; }
          .bottom-nav { display: none !important; }
          .nav-search {
            position: relative;
            max-width: 320px;
            width: 100%;
          }
          @media (max-width: 1024px) {
            .top-navbar {
              padding: 0 1rem !important;
            }
            .nav-search { display: none !important; }
            .mobile-logo { display: flex !important; align-items: center; gap: 8px; }
            .desktop-title { display: none !important; }
            .bottom-nav { display: flex !important; }
          }
        `}</style>

        {/* Left Side: View Title / Mobile Logo */}
        <h2 className="desktop-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {getViewTitle()}
        </h2>

        <div className="mobile-logo">
          <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', padding: '4px', display: 'flex' }}>
            <Compass size={16} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            VoyageIQ
          </span>
        </div>

        {/* Center: Search Input */}
        <div className="nav-search">
          <input
            type="text"
            placeholder="Search trips, cities, itineraries..."
            style={{
              width: '100%',
              padding: '0.45rem 1rem 0.45rem 2.2rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
              outline: 'none',
              transition: 'border 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Right Side: Notifications & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Notifications bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                display: 'flex',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: showNotifications ? 'var(--bg-tertiary)' : 'transparent',
                color: 'var(--text-secondary)',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => !showNotifications && (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => !showNotifications && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-warning)',
                    border: '2px solid var(--bg-secondary)',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div
                className="glass-panel animate-slide-up"
                style={{
                  position: 'absolute',
                  top: '45px',
                  right: 0,
                  width: '320px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xl)',
                  overflow: 'hidden',
                  zIndex: 200,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unreadCount} unread</span>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No notifications yet</div>
                  ) : notifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-color-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        cursor: 'pointer',
                        backgroundColor: notif.isRead ? 'transparent' : 'rgba(99,102,241,0.05)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? 'transparent' : 'rgba(99,102,241,0.05)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {notif.title || notif.type}
                        </span>
                        {!notif.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-primary)', flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '8px 16px', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
                  <button onClick={() => setShowNotifications(false)} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    Close Panel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User profile image */}
          <img
            src={currentUser?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              cursor: 'pointer',
            }}
            onClick={() => setCurrentView('profile' as any)}
          />
        </div>
      </header>

      {/* Bottom Sticky Tab Navigation Bar (Mobile / Tablet ONLY) */}
      <nav
        className="bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -4px 10px rgba(0,0,0,0.03)',
        }}
      >
        {navItemsMobile.map((item) => {
          const isActive = currentView === item.view;
          return (
            <div
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                color: isActive ? 'var(--color-primary)' : 'var(--text-light)',
                cursor: 'pointer',
                flex: 1,
                height: '100%',
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>
    </>
  );
};
