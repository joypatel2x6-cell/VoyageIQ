import React, { useState, useEffect, useRef } from 'react';
import { useApp, type ViewType } from '../context/AppContext';
import {
  Compass, Search, Bell, Menu, X, ChevronDown,
  User, Settings, Map, LogOut, Plus
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    currentUser,
    setActiveTripId,
    logoutUser,
    isAdmin,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Monitor scroll to apply subtle shadow/border change
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(target) && 
        !target.closest('.mobile-menu-toggle')
      ) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync active view titles or highlights
  const isActive = (view: ViewType) => {
    if (view === 'my-trips' && currentView === 'trip-summary') return true;
    return currentView === view;
  };

  const handleNavigate = (view: ViewType) => {
    if (view === 'plan-trip') {
      setActiveTripId(null);
    }
    setCurrentView(view);
    setShowMobileMenu(false);
  };

  // Nav Links List
  const navLinks: { view: ViewType; label: string }[] = [
    { view: 'dashboard', label: 'Dashboard' },
    { view: 'my-trips', label: 'My Trips' },
    { view: 'plan-trip', label: 'Plan Trip' },
    { view: 'explore', label: 'Explore' },
    { view: 'community', label: 'Community' },
    { view: 'calendar', label: 'Calendar' },
    { view: 'cost-calculator', label: 'Cost Calculator' }
  ];

  return (
    <>
      <header
        role="banner"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2000,
          height: '68px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: scrolled ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' : '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          transition: 'box-shadow 0.2s ease-in-out',
          width: '100%',
          boxSizing: 'border-box'
        }}
        className="global-navbar"
      >
        <style>{`
          .desktop-nav { display: flex; align-items: center; gap: 10px; }
          .desktop-controls { display: flex; align-items: center; gap: 20px; }
          .mobile-menu-toggle { display: none; }
          .mobile-dropdown-menu { display: none; }
          
          .nav-link-pill {
            font-size: 14px;
            font-weight: 500;
            color: #64748B;
            padding: 6px 14px;
            border-radius: 9999px;
            text-decoration: none;
            cursor: pointer;
            transition: all 180ms ease-in-out;
            user-select: none;
          }
          .nav-link-pill:hover {
            color: #2563EB;
            background-color: #EFF6FF;
          }
          .nav-link-pill.active {
            color: #2563EB;
            background-color: #EFF6FF;
            font-weight: 600;
          }

          .plan-trip-cta {
            font-size: 14px;
            font-weight: 600;
            background-color: #2563EB;
            color: #FFFFFF !important;
            padding: 6px 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 180ms ease-in-out;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.15);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: none;
          }
          .plan-trip-cta:hover {
            background-color: #1D4ED8;
            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);
            transform: translateY(-0.5px);
          }
          .plan-trip-cta.active {
            background-color: #1D4ED8;
            font-weight: 700;
          }

          .search-container {
            position: relative;
            display: flex;
            align-items: center;
            background-color: #F1F5F9;
            border-radius: 9999px;
            padding: 4px 12px 4px 32px;
            width: 180px;
            transition: width 0.2s ease-in-out, background-color 0.2s;
            border: 1px solid transparent;
          }
          .search-container:focus-within {
            width: 220px;
            background-color: #FFFFFF;
            border-color: #2563EB;
          }
          .search-input {
            border: none;
            background: transparent;
            outline: none;
            font-size: 13.5px;
            color: #0F172A;
            width: 100%;
          }
          .search-input::placeholder {
            color: #64748B;
          }

          .avatar-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            border: none;
            background: transparent;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: background-color 0.15s;
          }
          .avatar-btn:hover {
            background-color: #F1F5F9;
          }

          @media (max-width: 1024px) {
            .desktop-nav { display: none !important; }
            .desktop-controls { display: none !important; }
            .mobile-menu-toggle {
              display: flex;
              align-items: center;
              justify-content: center;
              border: none;
              background: transparent;
              color: #0F172A;
              cursor: pointer;
              padding: 8px;
              border-radius: 6px;
            }
            .mobile-menu-toggle:hover {
              background-color: #EFF6FF;
            }
          }
        `}</style>

        {/* ── LEFT: Logo ──────────────────────────────────────────────────── */}
        <div
          onClick={() => handleNavigate('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ backgroundColor: '#2563EB', borderRadius: '8px', padding: '6px', display: 'flex' }}>
            <Compass size={20} color="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              VoyageIQ
            </span>
            <span style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 500, marginTop: '1px' }}>
              Plan Smarter. Travel Further.
            </span>
          </div>
        </div>

        {/* ── CENTER: Desktop Navigation ──────────────────────────────────── */}
        <nav aria-label="Main desktop menu" className="desktop-nav">
          {navLinks.map((link) => {
            const active = isActive(link.view);
            const isCTA = link.view === 'plan-trip';

            if (isCTA) {
              return (
                <button
                  key={link.view}
                  onClick={() => handleNavigate(link.view)}
                  className={`plan-trip-cta ${active ? 'active' : ''}`}
                >
                  <Plus size={14} />
                  Plan Trip
                </button>
              );
            }

            return (
              <div
                key={link.view}
                onClick={() => handleNavigate(link.view)}
                className={`nav-link-pill ${active ? 'active' : ''}`}
              >
                {link.label}
              </div>
            );
          })}
        </nav>

        {/* ── RIGHT: Desktop Controls ──────────────────────────────────────── */}
        <div className="desktop-controls">
          {/* Integrated Search Input */}
          <div className="search-container">
            <Search size={14} color="#64748B" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              aria-label="Search site content"
            />
          </div>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }} ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                display: 'flex',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: showNotifications ? '#EFF6FF' : 'transparent',
                color: showNotifications ? '#2563EB' : '#0F172A',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s'
              }}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#2563EB',
                    border: '2px solid #FFFFFF'
                  }}
                />
              )}
            </button>

            {/* Notifications Dropdown Card */}
            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '320px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  zIndex: 2200
                }}
                className="animate-slide-up"
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      style={{ fontSize: '0.7rem', color: '#2563EB', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (notif.actionView) {
                            if (notif.tripId) {
                              setActiveTripId(notif.tripId);
                            }
                            setCurrentView(notif.actionView);
                          }
                          setShowNotifications(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #EFF6FF',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          cursor: 'pointer',
                          backgroundColor: notif.read ? 'transparent' : '#EFF6FF',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.read ? 'transparent' : '#EFF6FF'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: notif.type === 'budget' ? '#ef4444' : notif.type === 'trip' ? '#2563EB' : '#10b981'
                          }}>
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2563EB' }} />
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.4', margin: 0 }}>
                          {notif.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Avatar Dropdown */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="avatar-btn"
              aria-expanded={showProfileDropdown}
              aria-label="User menu"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="Profile"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #2563EB'
                  }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {currentUser.firstName[0]}
                </div>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                {currentUser.firstName}
              </span>
              <ChevronDown size={14} color="#64748B" />
            </button>

            {/* Profile Dropdown Card */}
            {showProfileDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '180px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  zIndex: 2200,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 0'
                }}
                className="animate-slide-up"
              >
                {[
                  { label: 'Profile', view: 'profile' as ViewType, icon: <User size={14} /> },
                  { label: 'Settings', view: 'profile' as ViewType, icon: <Settings size={14} /> },
                  { label: 'My Trips', view: 'my-trips' as ViewType, icon: <Map size={14} /> }
                ].map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleNavigate(option.view);
                      setShowProfileDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      color: '#0F172A',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s, color 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#EFF6FF';
                      e.currentTarget.style.color = '#2563EB';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#0F172A';
                    }}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
                {isAdmin && (
                  <>
                    <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />
                    <button
                      onClick={() => {
                        setCurrentView('admin' as ViewType);
                        setShowProfileDropdown(false);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', fontSize: '13.5px', fontWeight: 700,
                        color: '#2563EB', border: 'none', backgroundColor: 'transparent',
                        textAlign: 'left', cursor: 'pointer', transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      🛡️ Admin Panel
                    </button>
                  </>
                )}
                <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    logoutUser();
                    setShowProfileDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    color: '#EF4444',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE: Hamburger Toggle ────────────────────────────────────── */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="mobile-menu-toggle"
          aria-expanded={showMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* ── MOBILE: Dropdown Menu ─────────────────────────────────────────── */}
      {showMobileMenu && (
        <div
          ref={mobileMenuRef}
          style={{
            position: 'absolute',
            top: '68px',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            zIndex: 1999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '20px 24px',
            boxSizing: 'border-box'
          }}
          className="animate-slide-up"
        >
          {/* Main Links */}
          <nav aria-label="Mobile menu links" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.map((link) => {
              const active = isActive(link.view);
              const isCTA = link.view === 'plan-trip';

              if (isCTA) {
                return (
                  <button
                    key={link.view}
                    onClick={() => handleNavigate(link.view)}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      justifyContent: 'center',
                      marginTop: '4px'
                    }}
                    className={`plan-trip-cta ${active ? 'active' : ''}`}
                  >
                    <Plus size={14} />
                    Plan Trip
                  </button>
                );
              }

              return (
                <div
                  key={link.view}
                  onClick={() => handleNavigate(link.view)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#2563EB' : '#0F172A',
                    backgroundColor: active ? '#EFF6FF' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {link.label}
                </div>
              );
            })}
          </nav>

          <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />

          {/* Search (Mobile) */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            borderRadius: '8px',
            padding: '8px 12px 8px 36px'
          }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search trips, destinations..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                color: '#0F172A',
                width: '100%'
              }}
            />
          </div>

          {/* Notifications (Mobile Link) */}
          <div
            onClick={() => handleNavigate('insights')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#64748B" />
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '9999px',
                padding: '2px 8px'
              }}>
                {unreadCount}
              </span>
            )}
          </div>

          {/* Profile (Mobile Link) */}
          <div
            onClick={() => handleNavigate('profile')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Profile"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {currentUser.firstName[0]}
              </div>
            )}
            My Profile
          </div>
        </div>
      )}
    </>
  );
};
