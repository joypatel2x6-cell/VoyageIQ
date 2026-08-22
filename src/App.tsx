import React from 'react';
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

const MainLayout: React.FC = () => {
  const { currentView, isAuthenticated } = useApp();

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
      case 'my-trips':
        return <MyTrips />;
      case 'plan-trip':
        return <PlanTrip />;
      case 'explore':
        return <Explore />;
      case 'community':
        return <Community />;
      case 'calendar':
        return <CalendarView />;
      case 'trip-summary':
        return <TripSummary />;
      case 'dashboard':
      default:
        return <Dashboard />;
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

function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
