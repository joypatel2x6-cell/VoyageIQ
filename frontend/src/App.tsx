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
  const { currentView, isAuthenticated } = useApp();
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
