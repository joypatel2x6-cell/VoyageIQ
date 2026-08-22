import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';

// Views
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { MyTrips } from './views/MyTrips';
import { PlanTrip } from './views/PlanTrip';
import { Explore } from './views/Explore';
import { Community } from './views/Community';
import { CalendarView } from './views/CalendarView';
import { TripSummary } from './views/TripSummary';
import { ThingsToDo } from './views/ThingsToDo';
import { Profile } from './views/Profile';
import { SharedTrip } from './views/SharedTrip';
import { Insights } from './views/Insights';
import { AdminLogin } from './views/AdminLogin';
import { AdminDashboard } from './views/AdminDashboard';

// ─────────────────────────────────────────────────────────────────────────────
//  Admin Gate — completely separate from the main app auth
// ─────────────────────────────────────────────────────────────────────────────
const AdminGate: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [adminAuthed, setAdminAuthed] = useState(false);

  if (!adminAuthed) {
    return <AdminLogin onSuccess={() => setAdminAuthed(true)} onBack={onExit} />;
  }
  return <AdminDashboard onLogout={onExit} />;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main Application Layout
// ─────────────────────────────────────────────────────────────────────────────
const MainLayout: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    isAuthenticated,
    setIsAuthenticated,
    activeTripId,
    setActiveTripId,
    sharedTripId,
    setSharedTripId
  } = useApp();

  const [adminMode, setAdminMode] = useState(false);

  // Secret keyboard shortcut: Ctrl + Shift + A → opens Admin Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAdminMode(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Sync URL Address Bar with Current View (Simple SPA Router) ──
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/login') {
        setIsAuthenticated(false);
      } else if (path === '/admin') {
        setAdminMode(true);
      } else if (path === '/explore') {
        setCurrentView('explore');
      } else if (path === '/community') {
        setCurrentView('community');
      } else if (path.startsWith('/community/trip/')) {
        const id = path.replace('/community/trip/', '');
        setSharedTripId(id);
        setCurrentView('shared-trip');
      } else if (path === '/profile') {
        setCurrentView('profile');
      } else if (path === '/trips') {
        setCurrentView('my-trips');
      } else if (path === '/trips/new') {
        setActiveTripId(null);
        setCurrentView('plan-trip');
      } else if (path.startsWith('/trips/') && path.endsWith('/itinerary')) {
        const id = path.replace('/trips/', '').replace('/itinerary', '');
        setActiveTripId(id);
        setCurrentView('plan-trip');
      } else if (path.startsWith('/trips/') && path.endsWith('/budget')) {
        const id = path.replace('/trips/', '').replace('/budget', '');
        setActiveTripId(id);
        setCurrentView('plan-trip');
      } else if (path.startsWith('/trips/') && path.endsWith('/calendar')) {
        const id = path.replace('/trips/', '').replace('/calendar', '');
        setActiveTripId(id);
        setCurrentView('calendar');
      } else if (path.startsWith('/trips/')) {
        const id = path.replace('/trips/', '');
        setActiveTripId(id);
        setCurrentView('trip-summary');
      } else if (path === '/activities') {
        setCurrentView('things-to-do');
      } else if (path === '/dashboard' || path === '/') {
        setCurrentView('dashboard');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [setIsAuthenticated, setCurrentView, setActiveTripId, setSharedTripId]);

  // Sync URL when states change
  useEffect(() => {
    let path = '/dashboard';
    if (adminMode) {
      path = '/admin';
    } else if (currentView === 'shared-trip') {
      path = sharedTripId ? `/community/trip/${sharedTripId}` : '/shared-trip';
    } else if (currentView === 'my-trips') {
      path = '/trips';
    } else if (currentView === 'plan-trip') {
      path = activeTripId ? `/trips/${activeTripId}/itinerary` : '/trips/new';
    } else if (currentView === 'trip-summary') {
      path = activeTripId ? `/trips/${activeTripId}` : '/trips';
    } else if (currentView === 'calendar') {
      path = activeTripId ? `/trips/${activeTripId}/calendar` : '/trips';
    } else if (currentView === 'explore') {
      path = '/explore';
    } else if (currentView === 'things-to-do') {
      path = '/activities';
    } else if (currentView === 'community') {
      path = '/community';
    } else if (currentView === 'profile') {
      path = '/profile';
    } else if (!isAuthenticated) {
      path = '/login';
    }

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [currentView, activeTripId, sharedTripId, adminMode, isAuthenticated]);

  // Admin panel takes over the entire viewport — completely isolated
  if (adminMode) {
    return (
      <>
        <AdminGate onExit={() => setAdminMode(false)} />
        <ToastContainer />
      </>
    );
  }

  // Public shared trip (no auth required)
  if (currentView === 'shared-trip') {
    return (
      <>
        <SharedTrip />
        <ToastContainer />
      </>
    );
  }

  // Unauthenticated → show login
  if (!isAuthenticated) {
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    );
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'my-trips':     return <MyTrips />;
      case 'plan-trip':    return <PlanTrip />;
      case 'explore':      return <Explore />;
      case 'community':    return <Community />;
      case 'calendar':     return <CalendarView />;
      case 'trip-summary': return <TripSummary />;
      case 'things-to-do': return <ThingsToDo />;
      case 'profile':      return <Profile />;
      case 'insights':     return <Insights />;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case ('shared-trip' as any): return <SharedTrip />;
      case 'dashboard':
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sticky desktop navigation sidebar */}
      <Sidebar />

      {/* Main viewport */}
      <div className="main-content animate-fade-in">
        {/* Responsive top header */}
        <Navbar />

        {/* Dynamic page container */}
        <main className="view-container">
          {renderActiveView()}
        </main>
      </div>

      {/* Global alert toast notifier */}
      <ToastContainer />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Root
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
