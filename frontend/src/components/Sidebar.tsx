import React from 'react';
import { useApp, type ViewType } from '../context/AppContext';
import { LayoutDashboard, Map, CalendarPlus, Compass, Share2, Calendar, Sparkles, UserCircle2, ExternalLink, BrainCircuit } from 'lucide-react';

interface NavItem {
  view: ViewType;
  label: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useApp();

  const navItems: NavItem[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { view: 'my-trips', label: 'My Trips', icon: <Map size={20} /> },
    { view: 'plan-trip', label: 'Plan Trip', icon: <CalendarPlus size={20} /> },
    { view: 'explore', label: 'Explore', icon: <Compass size={20} /> },
    { view: 'things-to-do', label: 'Things to Do', icon: <Sparkles size={20} /> },
    { view: 'community', label: 'Community', icon: <Share2 size={20} /> },
    { view: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { view: 'insights', label: 'Smart Insights', icon: <BrainCircuit size={20} /> },
    { view: 'profile', label: 'My Profile', icon: <UserCircle2 size={20} /> },
    { view: 'shared-trip', label: 'Shared Trip Demo', icon: <ExternalLink size={20} /> },
  ];

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--bg-dark-accent)',
    color: 'var(--text-on-dark)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  };

  const logoContainerStyle: React.CSSProperties = {
    height: 'var(--navbar-height)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    gap: '10px',
  };

  const navListStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  };

  const getLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.925rem',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--text-on-primary)' : 'rgba(255, 255, 255, 0.65)',
    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, isActive: boolean) => {
    if (isActive) return;
    e.currentTarget.style.color = '#ffffff';
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    e.currentTarget.style.transform = 'translateX(4px)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>, isActive: boolean) => {
    if (isActive) return;
    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.transform = 'none';
  };

  return (
    <aside style={sidebarStyle} className="desktop-sidebar">
      <style>{`
        @media (max-width: 1024px) {
          .desktop-sidebar {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Brand Logo */}
      <div style={logoContainerStyle}>
        <div
          style={{
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '6px',
            display: 'flex',
          }}
        >
          <Compass size={22} color="#ffffff" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            VoyageIQ
          </span>
          <span style={{ fontSize: '0.625rem', opacity: 0.5, marginTop: '-2px' }}>
            Plan Smarter. Travel Further.
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1 }}>
        <ul style={navListStyle}>
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <li key={item.view}>
                <div
                  style={getLinkStyle(isActive)}
                  onClick={() => setCurrentView(item.view)}
                  onMouseEnter={(e) => handleMouseEnter(e, isActive)}
                  onMouseLeave={(e) => handleMouseLeave(e, isActive)}
                >
                  <span style={{ display: 'flex', opacity: isActive ? 1 : 0.8 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer Profile */}
      <div
        onClick={() => setCurrentView('profile')}
        style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        title="Go to My Profile"
      >
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
          alt="User Profile"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--color-primary)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Ayush
          </span>
          <span style={{ fontSize: '0.725rem', opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ayush@voyageiq.com
          </span>
        </div>
      </div>
    </aside>
  );
};
