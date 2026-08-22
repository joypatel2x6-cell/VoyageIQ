import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Trip, Activity, CityDestination, CommunityPost } from '../data/mockData';
import { mockTrips, mockCommunityPosts, mockInsights } from '../data/mockData';
import { api, getAuthToken, removeAuthToken } from '../services/api';

export type ViewType = 'dashboard' | 'my-trips' | 'plan-trip' | 'explore' | 'community' | 'calendar' | 'trip-summary' | 'things-to-do' | 'profile' | 'shared-trip' | 'insights';

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
  communityLoading: boolean;
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
  currentUser: any | null;
  logoutUser: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [activeTripId, setActiveTripId] = useState<string | null>('trip-1'); // Default to Japan trip
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [insights] = useState(mockInsights);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Load community posts from backend (public endpoint — no auth required)
  const loadCommunityPosts = useCallback(async () => {
    setCommunityLoading(true);
    try {
      const res = await api.community.getPosts();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Map backend shape → frontend CommunityPost shape
        const mapped: CommunityPost[] = res.data.map((p: any) => ({
          id: p.id,
          authorName: p.authorName || (p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Traveller'),
          authorAvatar: p.authorAvatar || p.author?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80',
          likesCount: p.likesCount ?? p._count?.likes ?? 0,
          commentsCount: p.commentsCount ?? p._count?.comments ?? 0,
          tags: p.tags ?? [],
          isLikedByMe: p.isLikedByMe ?? false,
          trip: {
            id: p.trip?.id ?? p.tripId ?? p.id,
            name: p.trip?.name ?? p.title ?? 'Shared Trip',
            description: p.trip?.description ?? p.description ?? '',
            startDate: p.trip?.startDate ? p.trip.startDate.split('T')[0] : '',
            endDate: p.trip?.endDate ? p.trip.endDate.split('T')[0] : '',
            budgetLimit: p.trip?.budget ?? p.trip?.budgetLimit ?? 0,
            currency: p.trip?.currency ?? 'USD',
            isShared: true,
            likesCount: p.likesCount ?? 0,
            commentsCount: p.commentsCount ?? 0,
            travelStyle: p.trip?.travelStyle ?? 'Balanced',
            travelersCount: p.trip?.travelersCount ?? 1,
            coverImage: p.trip?.coverImage ?? '',
            collaborators: [],
            destinations: p.trip?.stops?.map((s: any) => ({
              id: s.id,
              name: s.city?.name ?? 'City',
              country: s.city?.country ?? '',
              image: s.city?.image ?? 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
              arrivalDate: s.arrivalDate ? s.arrivalDate.split('T')[0] : '',
              departureDate: s.departureDate ? s.departureDate.split('T')[0] : '',
              activities: s.activities?.map((a: any) => ({
                id: a.id,
                title: a.activity?.name ?? a.customTitle ?? 'Activity',
                category: a.activity?.category ?? 'activity',
                time: a.startTime ?? '10:00',
                date: a.scheduledDate ? a.scheduledDate.split('T')[0] : '',
                cost: Number(a.cost) || 0,
                location: a.activity?.address ?? '',
                rating: 4.5,
                image: a.activity?.image ?? '',
              })) ?? [],
            })) ?? [],
          },
        }));
        setCommunityPosts(mapped);
      } else {
        // Fall back to mock data if backend returns nothing
        setCommunityPosts(mockCommunityPosts);
      }
    } catch {
      // Silently fall back to mock data if backend is unavailable
      setCommunityPosts(mockCommunityPosts);
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunityPosts();
  }, [loadCommunityPosts]);

  // Validate existing auth token & load user trips on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.auth.getMe()
        .then((res) => {
          if (res.success && res.user) {
            setIsAuthenticated(true);
            setCurrentUser(res.user);
            // Load user trips from backend
            return api.trips.getMyTrips();
          }
        })
        .then((res) => {
          if (res && res.success && res.data && res.data.trips && res.data.trips.length > 0) {
            const formattedTrips: Trip[] = res.data.trips.map((t: any) => ({
              id: t.id,
              name: t.name,
              description: t.description || '',
              startDate: t.startDate ? t.startDate.split('T')[0] : '',
              endDate: t.endDate ? t.endDate.split('T')[0] : '',
              budgetLimit: t.budget || 0,
              currency: t.currency || 'USD',
              coverImage: t.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
              collaborators: [],
              isShared: t.isPublic || false,
              likesCount: 0,
              commentsCount: 0,
              destinations: t.stops ? t.stops.map((s: any) => ({
                id: s.id,
                name: s.city?.name || 'City',
                country: s.city?.country || 'Country',
                image: s.city?.image || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
                arrivalDate: s.arrivalDate ? s.arrivalDate.split('T')[0] : '',
                departureDate: s.departureDate ? s.departureDate.split('T')[0] : '',
                activities: s.activities ? s.activities.map((a: any) => ({
                  id: a.id,
                  title: a.activity?.name || a.customTitle || 'Activity',
                  category: a.activity?.category || 'Sightseeing',
                  time: a.startTime || '10:00 AM',
                  date: a.scheduledDate ? a.scheduledDate.split('T')[0] : '',
                  cost: Number(a.cost) || 0,
                  location: a.activity?.address || '',
                  rating: 4.8,
                  image: a.activity?.image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
                })) : [],
              })) : [],
            }));
            setTrips(formattedTrips);
            setActiveTripId(formattedTrips[0].id);
          }
        })
        .catch(() => {
          removeAuthToken();
          setIsAuthenticated(false);
          setCurrentUser(null);
        });
    }
  }, []);

  const logoutUser = () => {
    api.auth.logout().catch(() => {});
    removeAuthToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
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

    // Sync with backend database if authenticated
    if (getAuthToken()) {
      api.trips.create({
        name: tripData.name,
        startDate: tripData.startDate || new Date().toISOString().split('T')[0],
        endDate: tripData.endDate || new Date().toISOString().split('T')[0],
        budget: tripData.budgetLimit || 1000,
        currency: tripData.currency || 'USD',
        coverImage: tripData.coverImage || '',
        isPublic: tripData.isShared || false,
      }).then((res) => {
        if (res.success && res.trip) {
          setTrips((prev) => prev.map((t) => t.id === newId ? { ...t, id: res.trip.id } : t));
          if (activeTripId === newId) setActiveTripId(res.trip.id);
        }
      }).catch((err) => {
        console.warn('Backend trip creation failed:', err.message);
      });
    }

    showToast(`Trip "${newTrip.name}" created successfully!`, 'success');
    return newId;
  };

  const updateTrip = (updatedTrip: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    
    if (getAuthToken() && updatedTrip.id.includes('-')) {
      api.trips.update(updatedTrip.id, {
        name: updatedTrip.name,
        budget: updatedTrip.budgetLimit,
        isPublic: updatedTrip.isShared,
      }).catch((err) => console.warn('Backend trip update failed:', err.message));
    }

    showToast(`Trip "${updatedTrip.name}" updated.`, 'info');
  };

  const deleteTrip = (id: string) => {
    const tripToDelete = trips.find((t) => t.id === id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (activeTripId === id) {
      setActiveTripId(trips.length > 1 ? trips.find(t => t.id !== id)?.id || null : null);
    }

    if (getAuthToken() && id.includes('-') && !id.startsWith('trip-')) {
      api.trips.delete(id).catch((err) => console.warn('Backend trip deletion failed:', err.message));
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

    // Persist to backend if authenticated and trip has a real DB id
    if (getAuthToken() && tripId && !tripId.startsWith('trip-')) {
      api.stops.addStop(tripId, {
        cityId: (cityData as any).cityId,
        arrivalDate: cityData.arrivalDate,
        departureDate: cityData.departureDate,
      }).then((res) => {
        if (res.success && res.stop) {
          // Sync the real stop ID from DB back into state
          setTrips((prev) =>
            prev.map((t) => {
              if (t.id === tripId) {
                return {
                  ...t,
                  destinations: t.destinations.map((d) =>
                    d.id === cityId ? { ...d, id: res.stop.id } : d
                  ),
                };
              }
              return t;
            })
          );
        }
      }).catch((err) => console.warn('Backend stop creation failed:', err.message));
    }

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
    // Optimistic toggle
    setCommunityPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const liked = (post as any).isLikedByMe;
          return {
            ...post,
            isLikedByMe: !liked,
            likesCount: liked ? post.likesCount - 1 : post.likesCount + 1,
          };
        }
        return post;
      })
    );

    // Sync with backend
    if (getAuthToken()) {
      const post = communityPosts.find((p) => p.id === postId);
      const isCurrentlyLiked = (post as any)?.isLikedByMe;
      const apiCall = isCurrentlyLiked
        ? api.community.unlikePost(postId)
        : api.community.likePost(postId);

      apiCall.then((res) => {
        // Sync exact count from server
        setCommunityPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likesCount: res.likesCount, isLikedByMe: res.isLikedByMe }
              : p
          )
        );
      }).catch(() => {
        // Revert optimistic update on error
        setCommunityPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              const liked = (p as any).isLikedByMe;
              return { ...p, isLikedByMe: !liked, likesCount: liked ? p.likesCount - 1 : p.likesCount + 1 };
            }
            return p;
          })
        );
      });
    }

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
        communityLoading,
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
        currentUser,
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
