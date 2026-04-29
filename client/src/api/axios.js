import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.endsWith('/api') 
    ? import.meta.env.VITE_API_URL 
    : `${import.meta.env.VITE_API_URL || ''}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('naturadry_user'));
    const token = user?.accessToken || user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const baseUrl = import.meta.env.VITE_API_URL?.endsWith('/api') 
          ? import.meta.env.VITE_API_URL 
          : `${import.meta.env.VITE_API_URL || ''}/api`;
        const refreshResponse = await axios.post(`${baseUrl}/auth/refresh`, {}, { withCredentials: true });
        if (refreshResponse.data?.success) {
          const newAccessToken = refreshResponse.data.data.accessToken;
          const userStr = localStorage.getItem('naturadry_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.accessToken = newAccessToken;
            localStorage.setItem('naturadry_user', JSON.stringify(user));
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('naturadry_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
