import axios from 'axios';
import { auth } from '../config/firebase';

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

// Interceptor 1: Token Attach & Cache Check
api.interceptors.request.use(
  async (config) => {
    // 1. Token Attach
    try {
      if (auth.currentUser) {
        // Firebase automatically caches the token and refreshes it if needed
        const token = await auth.currentUser.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.warn("Failed to get Firebase token:", e);
    }

    // 2. Cache Check (Only GET, exclude Auth)
    if (config.method?.toLowerCase() === 'get' && !config.url?.includes('/auth')) {
      const cacheKey = `${config.url}?${new URLSearchParams(config.params || {}).toString()}`;
      const cached = getCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // Create an Axios adapter to instantly resolve with the cached data
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
  (error) => {
    // If backend returns 401, sign out from Firebase
    if (error.response?.status === 401 && !error.config.url?.includes('/auth')) {
      if (auth.currentUser) {
         auth.signOut().then(() => {
            window.location.href = '/login';
         });
      }
    }
    return Promise.reject(error);
  }
);

export default api;

