import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith('/api')
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL || ''}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Simple In-Memory Cache for GET requests
const CACHE_TTL = 120 * 1000; // 2 minutes
const getCache = new Map();

// Helper to clear cache manually if needed (e.g., after mutations)
export const clearApiCache = () => {
  getCache.clear();
};

// Tracks whether a token refresh is already in flight to prevent race
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Interceptor 1: Token Attach & Cache Check
api.interceptors.request.use(
  (config) => {
    // 1. Token Attach
    try {
      const user = JSON.parse(localStorage.getItem('naturadry_user') || 'null');
      const token = user?.accessToken || user?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Corrupted localStorage — ignore and continue without token
    }

    // 2. Cache Check (Only GET, exclude Auth)
    if (config.method?.toLowerCase() === 'get' && !config.url?.includes('/auth')) {
      const cacheKey = `${config.url}?${new URLSearchParams(config.params || {}).toString()}`;
      const cached = getCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // Create an Axios CancelToken to abort the actual network request
        // and instantly resolve with the cached data
        config.adapter = () => {
          return Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: cached.headers,
            config,
            request: {}
          });
        };
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor 2: Response Handling & Cache Save
api.interceptors.response.use(
  (response) => {
    // Save successful GET requests to cache
    if (response.config.method?.toLowerCase() === 'get' && !response.config.url?.includes('/auth')) {
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params || {}).toString()}`;
      getCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and if this request hasn't been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the failed request WAS the refresh endpoint
    if (originalRequest.url?.includes('/auth/refresh')) {
      // The refresh token is invalid — clear state and redirect
      localStorage.removeItem('naturadry_user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      if (refreshResponse.data?.success) {
        const newAccessToken = refreshResponse.data.data.accessToken;

        // Update stored token
        try {
          const userStr = localStorage.getItem('naturadry_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.accessToken = newAccessToken;
            localStorage.setItem('naturadry_user', JSON.stringify(user));
          }
        } catch {
          // localStorage write failed — non-critical
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
    } catch (refreshError) {

      const status = refreshError.response?.status;
      if (status === 401 || status === 403) {
        processQueue(refreshError, null);
        localStorage.removeItem('naturadry_user');
        window.location.href = '/login';
      } else {
        processQueue(error, null);
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }

    return Promise.reject(error);
  }
);

export default api;
