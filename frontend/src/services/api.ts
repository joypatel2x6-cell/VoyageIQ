// Use relative path so Vite dev proxy forwards /api → http://localhost:5000
const API_BASE_URL = '/api/v1';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('voyageiq_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('voyageiq_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('voyageiq_token');
};

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;
  
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = getAuthToken();
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  };

  const response = await fetch(url, config);

  let data: any = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  // Auth API
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) =>
      request<{ success: boolean; token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () =>
      request<{ success: boolean; user: any }>('/auth/me'),
    logout: () =>
      request<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      }),
  },

  // Trips API
  trips: {
    getMyTrips: (query?: Record<string, string>) =>
      request<{ success: boolean; data: { trips: any[]; pagination: any } }>('/trips', {
        params: query,
      }),
    getDetail: (tripId: string) =>
      request<{ success: boolean; trip: any }>('/trips/' + tripId),
    create: (tripData: any) =>
      request<{ success: boolean; trip: any }>('/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      }),
    update: (tripId: string, tripData: any) =>
      request<{ success: boolean; trip: any }>('/trips/' + tripId, {
        method: 'PATCH',
        body: JSON.stringify(tripData),
      }),
    delete: (tripId: string) =>
      request<{ success: boolean; message: string }>('/trips/' + tripId, {
        method: 'DELETE',
      }),
    duplicate: (tripId: string) =>
      request<{ success: boolean; trip: any }>('/trips/' + tripId + '/duplicate', {
        method: 'POST',
      }),
  },

  // City & Stops API
  stops: {
    addStop: (tripId: string, stopData: any) =>
      request<{ success: boolean; stop: any }>('/trips/' + tripId + '/stops', {
        method: 'POST',
        body: JSON.stringify(stopData),
      }),
    updateStop: (tripId: string, stopId: string, stopData: any) =>
      request<{ success: boolean; stop: any }>('/trips/' + tripId + '/stops/' + stopId, {
        method: 'PATCH',
        body: JSON.stringify(stopData),
      }),
    deleteStop: (tripId: string, stopId: string) =>
      request<{ success: boolean; message: string }>('/trips/' + tripId + '/stops/' + stopId, {
        method: 'DELETE',
      }),
  },

  // Activities API
  activities: {
    addActivity: (tripId: string, stopId: string, activityData: any) =>
      request<{ success: boolean; activity: any }>('/trips/' + tripId + '/stops/' + stopId + '/activities', {
        method: 'POST',
        body: JSON.stringify(activityData),
      }),
    updateActivity: (activityId: string, activityData: any) =>
      request<{ success: boolean; activity: any }>('/activities/' + activityId, {
        method: 'PATCH',
        body: JSON.stringify(activityData),
      }),
    deleteActivity: (activityId: string) =>
      request<{ success: boolean; message: string }>('/activities/' + activityId, {
        method: 'DELETE',
      }),
  },

  // Community API
  community: {
    getPosts: (params?: Record<string, string>) =>
      request<{ success: boolean; data: any[]; pagination: any }>('/community/posts', {
        params,
      }),
    getPostById: (postId: string) =>
      request<{ success: boolean; post: any }>('/community/posts/' + postId),
    createPost: (postData: any) =>
      request<{ success: boolean; post: any }>('/community/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      }),
    updatePost: (postId: string, postData: any) =>
      request<{ success: boolean; post: any }>('/community/posts/' + postId, {
        method: 'PATCH',
        body: JSON.stringify(postData),
      }),
    deletePost: (postId: string) =>
      request<{ success: boolean; message: string }>('/community/posts/' + postId, {
        method: 'DELETE',
      }),
    likePost: (postId: string) =>
      request<{ success: boolean; message: string; likesCount: number; isLikedByMe: boolean }>(
        '/community/posts/' + postId + '/like',
        { method: 'POST' }
      ),
    unlikePost: (postId: string) =>
      request<{ success: boolean; message: string; likesCount: number; isLikedByMe: boolean }>(
        '/community/posts/' + postId + '/like',
        { method: 'DELETE' }
      ),
    getComments: (postId: string) =>
      request<{ success: boolean; comments: any[] }>('/community/posts/' + postId + '/comments'),
    addComment: (postId: string, content: string) =>
      request<{ success: boolean; comment: any }>('/community/posts/' + postId + '/comments', {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    deleteComment: (commentId: string) =>
      request<{ success: boolean; message: string }>('/community/comments/' + commentId, {
        method: 'DELETE',
      }),
  },

  // Users (profile management) API
  users: {
    getProfile: () =>
      request<{ success: boolean; user: any }>('/users/me'),
    updateProfile: (profileData: any) =>
      request<{ success: boolean; user: any }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      }),
    changePassword: (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      request<{ success: boolean; message: string }>('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify(passwordData),
      }),
    deleteAccount: () =>
      request<{ success: boolean; message: string }>('/users/me', {
        method: 'DELETE',
      }),
    getSavedDestinations: () =>
      request<{ success: boolean; savedDestinations: any[] }>('/users/me/saved-destinations'),
    saveDestination: (cityId: string) =>
      request<{ success: boolean; savedDestination: any }>('/users/me/saved-destinations/' + cityId, {
        method: 'POST',
      }),
    removeSavedDestination: (cityId: string) =>
      request<{ success: boolean; message: string }>('/users/me/saved-destinations/' + cityId, {
        method: 'DELETE',
      }),
  },

  // Notifications API
  notifications: {
    getNotifications: (params?: Record<string, string>) =>
      request<{ success: boolean; data: any[]; unreadCount: number; pagination: any }>('/notifications', {
        params,
      }),
    markAsRead: (notificationId: string) =>
      request<{ success: boolean; notification: any }>('/notifications/' + notificationId + '/read', {
        method: 'PATCH',
      }),
    markAllAsRead: () =>
      request<{ success: boolean; message: string; count: number }>('/notifications/read-all', {
        method: 'PATCH',
      }),
    deleteNotification: (notificationId: string) =>
      request<{ success: boolean; message: string }>('/notifications/' + notificationId, {
        method: 'DELETE',
      }),
  },

  // Sharing (public trip links) API
  sharing: {
    enableShare: (tripId: string) =>
      request<{ success: boolean; data: any }>('/trips/' + tripId + '/share', {
        method: 'POST',
      }),
    disableShare: (tripId: string) =>
      request<{ success: boolean; data: any }>('/trips/' + tripId + '/share', {
        method: 'DELETE',
      }),
    getPublicTrip: (shareToken: string) =>
      request<{ success: boolean; data: any }>('/public/trips/' + shareToken),
    copyPublicTrip: (shareToken: string) =>
      request<{ success: boolean; trip: any }>('/public/trips/' + shareToken + '/copy', {
        method: 'POST',
      }),
  },

  // Admin API
  admin: {
    getStatistics: () =>
      request<{ success: boolean; data: any }>('/admin/statistics'),
    getUserTrends: () =>
      request<{ success: boolean; data: any[] }>('/admin/user-trends'),
    getPopularCities: (limit?: number) =>
      request<{ success: boolean; data: any[] }>('/admin/popular-cities', {
        params: limit ? { limit: String(limit) } : undefined,
      }),
    getPopularActivities: (limit?: number) =>
      request<{ success: boolean; data: any[] }>('/admin/popular-activities', {
        params: limit ? { limit: String(limit) } : undefined,
      }),
    getUsers: (params?: Record<string, string>) =>
      request<{ success: boolean; data: any[]; pagination: any }>('/admin/users', {
        params,
      }),
    getUserDetail: (userId: string) =>
      request<{ success: boolean; user: any }>('/admin/users/' + userId),
    updateUserStatus: (userId: string, statusData: { isActive?: boolean; role?: string }) =>
      request<{ success: boolean; user: any }>('/admin/users/' + userId + '/status', {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }),
    deleteUser: (userId: string) =>
      request<{ success: boolean; message: string }>('/admin/users/' + userId, {
        method: 'DELETE',
      }),
  },

  // AI Itinerary API (OpenRouter)
  ai: {
    generateItinerary: (params: {
      destination: string;
      startDate: string;
      endDate: string;
      budgetLimit?: number;
      currency?: string;
      travelStyle?: string;
      travelersCount?: number;
      tripName?: string;
      notes?: string;
    }) =>
      request<{ success: boolean; data: any }>('/ai/generate-itinerary', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  },
};
