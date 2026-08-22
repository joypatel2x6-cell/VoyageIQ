import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Trip, Activity, CityDestination, CommunityPost } from '../data/mockData';
import { mockTrips, mockCommunityPosts, mockInsights } from '../data/mockData';

export type ViewType = 'dashboard' | 'my-trips' | 'plan-trip' | 'explore' | 'community' | 'calendar' | 'trip-summary' | 'things-to-do';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  trips: Trip[];
  activeTripId: string | null;
  setActiveTripId: (id: string | null) => void;
  communityPosts: CommunityPost[];
  insights: typeof mockInsights;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'likesCount' | 'commentsCount'>) => string;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (id: string) => void;
  addCityToTrip: (tripId: string, city: Omit<CityDestination, 'id' | 'activities'>) => void;
  removeCityFromTrip: (tripId: string, cityId: string) => void;
  addActivity: (tripId: string, cityId: string, activity: Omit<Activity, 'id'>) => void;
  removeActivity: (tripId: string, cityId: string, activityId: string) => void;
  cloneTrip: (communityTrip: Trip) => void;
  likeCommunityPost: (postId: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  logoutUser: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [activeTripId, setActiveTripId] = useState<string | null>('trip-1'); // Default to Japan trip
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [insights] = useState(mockInsights);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logoutUser = () => {
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    showToast('Successfully signed out.', 'info');
  };

  // Auto-remove toasts after 3.5 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addTrip = (tripData: Omit<Trip, 'id' | 'likesCount' | 'commentsCount'>) => {
    const newId = `trip-${Math.random().toString(36).substring(2, 9)}`;
    const newTrip: Trip = {
      ...tripData,
      id: newId,
      likesCount: 0,
      commentsCount: 0,
      destinations: tripData.destinations || [],
    };
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(newId);
    showToast(`Trip "${newTrip.name}" created successfully!`, 'success');
    return newId;
  };

  const updateTrip = (updatedTrip: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    showToast(`Trip "${updatedTrip.name}" updated.`, 'info');
  };

  const deleteTrip = (id: string) => {
    const tripToDelete = trips.find((t) => t.id === id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (activeTripId === id) {
      setActiveTripId(trips.length > 1 ? trips.find(t => t.id !== id)?.id || null : null);
    }
    showToast(`Deleted trip "${tripToDelete?.name || 'Unknown'}"`, 'warning');
  };

  const addCityToTrip = (tripId: string, cityData: Omit<CityDestination, 'id' | 'activities'>) => {
    const cityId = `city-${Math.random().toString(36).substring(2, 9)}`;
    const newCity: CityDestination = {
      ...cityData,
      id: cityId,
      activities: []
    };

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          return {
            ...t,
            destinations: [...t.destinations, newCity]
          };
        }
        return t;
      })
    );
    showToast(`Added ${cityData.name} to itinerary.`, 'success');
  };

  const removeCityFromTrip = (tripId: string, cityId: string) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          return {
            ...t,
            destinations: t.destinations.filter((c) => c.id !== cityId)
          };
        }
        return t;
      })
    );
    showToast(`Removed city from itinerary.`, 'warning');
  };

  const addActivity = (tripId: string, cityId: string, activityData: Omit<Activity, 'id'>) => {
    const activityId = `act-${Math.random().toString(36).substring(2, 9)}`;
    const newActivity: Activity = {
      ...activityData,
      id: activityId
    };

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          const updatedDestinations = t.destinations.map((d) => {
            if (d.id === cityId) {
              return {
                ...d,
                activities: [...d.activities, newActivity].sort((a, b) => {
                  if (a.date !== b.date) return a.date.localeCompare(b.date);
                  return a.time.localeCompare(b.time);
                })
              };
            }
            return d;
          });
          
          const totalCost = updatedDestinations.reduce(
            (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
            0
          );

          const currencySymbols: Record<string, string> = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            AUD: 'A$',
            CAD: 'C$',
            INR: '₹',
          };
          const symbol = currencySymbols[t.currency || 'USD'] || '$';

          if (totalCost > t.budgetLimit) {
            setTimeout(() => {
              showToast(`Budget warning! Expenses (${symbol}${totalCost.toLocaleString()}) exceed your limit of ${symbol}${t.budgetLimit.toLocaleString()}!`, 'warning');
            }, 100);
          }

          return {
            ...t,
            destinations: updatedDestinations
          };
        }
        return t;
      })
    );
    showToast(`Added activity: "${activityData.title}"`, 'success');
  };

  const removeActivity = (tripId: string, cityId: string, activityId: string) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          return {
            ...t,
            destinations: t.destinations.map((d) => {
              if (d.id === cityId) {
                return {
                  ...d,
                  activities: d.activities.filter((a) => a.id !== activityId)
                };
              }
              return d;
            })
          };
        }
        return t;
      })
    );
    showToast('Activity removed.', 'info');
  };

  const cloneTrip = (communityTrip: Trip) => {
    const newId = `trip-${Math.random().toString(36).substring(2, 9)}`;
    const cloned: Trip = {
      ...communityTrip,
      id: newId,
      name: `Cloned: ${communityTrip.name}`,
      isShared: false,
      likesCount: 0,
      commentsCount: 0,
      collaborators: []
    };
    
    setTrips((prev) => [cloned, ...prev]);
    setActiveTripId(newId);
    setCurrentView('dashboard');
    showToast(`Successfully cloned "${communityTrip.name}" to your trips!`, 'success');
  };

  const likeCommunityPost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            likesCount: post.likesCount + 1
          };
        }
        return post;
      })
    );
    showToast('Post liked!', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        trips,
        activeTripId,
        setActiveTripId,
        communityPosts,
        insights,
        toasts,
        showToast,
        removeToast,
        addTrip,
        updateTrip,
        deleteTrip,
        addCityToTrip,
        removeCityFromTrip,
        addActivity,
        removeActivity,
        cloneTrip,
        likeCommunityPost,
        isAuthenticated,
        setIsAuthenticated,
        logoutUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
