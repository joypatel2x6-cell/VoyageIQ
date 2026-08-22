import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Trip, Activity, CityDestination, CommunityPost } from '../data/mockData';
import { mockTrips, mockCommunityPosts, mockInsights } from '../data/mockData';

export type ViewType =
  | 'dashboard' | 'my-trips' | 'plan-trip' | 'explore' | 'community'
  | 'calendar'  | 'trip-summary' | 'things-to-do' | 'profile' | 'shared-trip'
  | 'insights';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'trip' | 'budget' | 'community' | 'system';
  read: boolean;
  timestamp: Date;
  actionView?: ViewType;
  tripId?: string;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  avatarUrl: string | null;
  preferences: string[];
  travelStyle: 'Budget' | 'Balanced' | 'Luxury';
  language: string;
  joinedAt: string;
}

interface AppContextType {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // User
  currentUser: CurrentUser;
  updateUser: (updates: Partial<CurrentUser>) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  logoutUser: () => void;

  // Trips
  trips: Trip[];
  activeTripId: string | null;
  setActiveTripId: (id: string | null) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'likesCount' | 'commentsCount'>) => string;
  updateTrip: (trip: Trip) => void;
  deleteTrip: (id: string) => void;
  addCityToTrip: (tripId: string, city: Omit<CityDestination, 'id' | 'activities'>) => void;
  removeCityFromTrip: (tripId: string, cityId: string) => void;
  addActivity: (tripId: string, cityId: string, activity: Omit<Activity, 'id'>) => void;
  removeActivity: (tripId: string, cityId: string, activityId: string) => void;
  cloneTrip: (communityTrip: Trip) => void;

  // Community
  communityPosts: CommunityPost[];
  sharedTripId: string | null;
  setSharedTripId: (id: string | null) => void;
  likeCommunityPost: (postId: string) => void;

  // Insights (legacy)
  insights: typeof mockInsights;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Default current user
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_USER: CurrentUser = {
  id: 'user-1',
  firstName: 'Ayush',
  lastName: 'Patel',
  email: 'ayush@voyageiq.com',
  phone: '+91 98765 43210',
  city: 'Mumbai',
  country: 'India',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  preferences: ['Adventure', 'Culture', 'Food'],
  travelStyle: 'Balanced',
  language: 'English',
  joinedAt: '2025-01-15',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Seed notifications
// ─────────────────────────────────────────────────────────────────────────────
const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Welcome to VoyageIQ!',
    body: 'Your account is ready. Start planning your first adventure.',
    type: 'system',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actionView: 'plan-trip',
  },
  {
    id: 'notif-2',
    title: 'Budget Alert — Japan Trip',
    body: 'Your Japan trip is at 85% of the budget. Review activities to stay on track.',
    type: 'budget',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actionView: 'trip-summary',
    tripId: 'trip-1',
  },
  {
    id: 'notif-3',
    title: 'New community trip',
    body: 'Norwegian Fjords & Arctic Wilderness has 612 new likes this week.',
    type: 'community',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actionView: 'community',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Context
// ─────────────────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [activeTripId, setActiveTripId] = useState<string | null>('trip-1');
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  const [sharedTripId, setSharedTripId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [insights] = useState(mockInsights);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEFAULT_USER);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Auto-remove toasts after 3.5s ─────────────────────────────────────────
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => setToasts(prev => prev.slice(1)), 3500);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Notification helpers ───────────────────────────────────────────────────
  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]); // keep last 20
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ── User helpers ───────────────────────────────────────────────────────────
  const updateUser = useCallback((updates: Partial<CurrentUser>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  }, []);

  const logoutUser = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    showToast('Successfully signed out. See you next adventure! ✈️', 'info');
  }, [showToast]);

  // ── Trip CRUD ──────────────────────────────────────────────────────────────
  const addTrip = useCallback((tripData: Omit<Trip, 'id' | 'likesCount' | 'commentsCount'>) => {
    const newId = `trip-${Math.random().toString(36).substring(2, 9)}`;
    const newTrip: Trip = {
      ...tripData,
      id: newId,
      likesCount: 0,
      commentsCount: 0,
      destinations: tripData.destinations || [],
    };
    setTrips(prev => [newTrip, ...prev]);
    setActiveTripId(newId);
    showToast(`✈️ Trip "${newTrip.name}" created! Start adding cities.`, 'success');
    addNotification({
      title: 'New trip created',
      body: `"${newTrip.name}" has been added to your trips.`,
      type: 'trip',
      actionView: 'plan-trip',
      tripId: newId,
    });
    return newId;
  }, [showToast, addNotification]);

  const updateTrip = useCallback((updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    showToast(`Trip "${updatedTrip.name}" updated.`, 'info');
  }, [showToast]);

  const deleteTrip = useCallback((id: string) => {
    const tripToDelete = trips.find(t => t.id === id);
    setTrips(prev => prev.filter(t => t.id !== id));
    if (activeTripId === id) {
      const remaining = trips.filter(t => t.id !== id);
      setActiveTripId(remaining.length > 0 ? remaining[0].id : null);
    }
    showToast(`Deleted "${tripToDelete?.name || 'trip'}"`, 'warning');
  }, [trips, activeTripId, showToast]);

  // ── City CRUD ──────────────────────────────────────────────────────────────
  const addCityToTrip = useCallback((tripId: string, cityData: Omit<CityDestination, 'id' | 'activities'>) => {
    const cityId = `city-${Math.random().toString(36).substring(2, 9)}`;
    const newCity: CityDestination = { ...cityData, id: cityId, activities: [] };
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      return { ...t, destinations: [...t.destinations, newCity] };
    }));
    showToast(`📍 ${cityData.name} added to your itinerary!`, 'success');
  }, [showToast]);

  const removeCityFromTrip = useCallback((tripId: string, cityId: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      return { ...t, destinations: t.destinations.filter(c => c.id !== cityId) };
    }));
    showToast('City removed from itinerary.', 'warning');
  }, [showToast]);

  // ── Activity CRUD ──────────────────────────────────────────────────────────
  const addActivity = useCallback((tripId: string, cityId: string, activityData: Omit<Activity, 'id'>) => {
    const activityId = `act-${Math.random().toString(36).substring(2, 9)}`;
    const newActivity: Activity = { ...activityData, id: activityId };

    const CURRENCY_SYMBOLS: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', INR: '₹',
    };

    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const sym = CURRENCY_SYMBOLS[t.currency || 'USD'] || '$';
      const updatedDestinations = t.destinations.map(d => {
        if (d.id !== cityId) return d;
        return {
          ...d,
          activities: [...d.activities, newActivity].sort((a, b) => {
            const dc = a.date.localeCompare(b.date);
            return dc !== 0 ? dc : a.time.localeCompare(b.time);
          }),
        };
      });

      // Check for budget breach after adding
      const totalCost = updatedDestinations.reduce(
        (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0), 0,
      );

      if (totalCost > t.budgetLimit) {
        setTimeout(() => {
          showToast(`⚠️ Budget exceeded! ${sym}${totalCost.toLocaleString()} vs limit ${sym}${t.budgetLimit.toLocaleString()}`, 'warning');
          addNotification({
            title: 'Budget exceeded',
            body: `"${t.name}" is now ${sym}${(totalCost - t.budgetLimit).toLocaleString()} over budget.`,
            type: 'budget',
            actionView: 'trip-summary',
            tripId: t.id,
          });
        }, 100);
      } else if (totalCost / t.budgetLimit > 0.9) {
        setTimeout(() => {
          showToast(`📊 Heads up: 90% of budget used on "${t.name}"`, 'warning');
        }, 100);
      }

      return { ...t, destinations: updatedDestinations };
    }));

    showToast(`✅ Added "${activityData.title}" to itinerary.`, 'success');
  }, [showToast, addNotification]);

  const removeActivity = useCallback((tripId: string, cityId: string, activityId: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        destinations: t.destinations.map(d => {
          if (d.id !== cityId) return d;
          return { ...d, activities: d.activities.filter(a => a.id !== activityId) };
        }),
      };
    }));
    showToast('Activity removed from itinerary.', 'info');
  }, [showToast]);

  // ── Community ──────────────────────────────────────────────────────────────
  const cloneTrip = useCallback((communityTrip: Trip) => {
    const newId = `trip-${Math.random().toString(36).substring(2, 9)}`;
    const cloned: Trip = {
      ...communityTrip,
      id: newId,
      name: `Copy of ${communityTrip.name}`,
      isShared: false,
      likesCount: 0,
      commentsCount: 0,
      collaborators: [],
    };
    setTrips(prev => [cloned, ...prev]);
    setActiveTripId(newId);
    showToast(`🗂️ "${communityTrip.name}" copied to My Trips!`, 'success');
    addNotification({
      title: 'Trip copied',
      body: `"${communityTrip.name}" has been copied to your trips as a draft.`,
      type: 'trip',
      actionView: 'my-trips',
      tripId: newId,
    });
    setCurrentView('my-trips');
  }, [showToast, addNotification]);

  const likeCommunityPost = useCallback((postId: string) => {
    setCommunityPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, likesCount: post.likesCount + 1 } : post,
    ));
    showToast('❤️ Post liked!', 'success');
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      currentUser, updateUser,
      isAuthenticated, setIsAuthenticated, logoutUser,
      trips, activeTripId, setActiveTripId,
      addTrip, updateTrip, deleteTrip,
      addCityToTrip, removeCityFromTrip,
      addActivity, removeActivity,
      cloneTrip,
      communityPosts, sharedTripId, setSharedTripId,
      likeCommunityPost,
      insights,
      notifications, unreadCount,
      addNotification, markNotificationRead, markAllNotificationsRead, clearNotification,
      toasts, showToast, removeToast,
      isLoading, setIsLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
