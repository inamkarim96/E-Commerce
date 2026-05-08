import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith('/api')
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL || ''}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

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

// Attach access token from localStorage to every outgoing request.
api.interceptors.request.use(
  (config) => {
    try {
      const user = JSON.parse(localStorage.getItem('naturadry_user') || 'null');
      const token = user?.accessToken || user?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Corrupted localStorage — ignore and continue without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
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
