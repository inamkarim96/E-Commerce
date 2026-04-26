import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for saved user on load and verify with backend
  useEffect(() => {
    const initAuth = async () => {
      const savedUserStr = localStorage.getItem('naturadry_user');
      if (!savedUserStr) {
        setLoading(false);
        return;
      }

      try {
        const savedUser = JSON.parse(savedUserStr);
        const response = await authApi.getProfile();
        if (response.success) {
          const fullUser = { ...response.data, accessToken: savedUser.accessToken };
          setUser(fullUser);
          localStorage.setItem('naturadry_user', JSON.stringify(fullUser));
        }
      } catch (error) {
        // Silently clear stale session
        localStorage.removeItem('naturadry_user');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Idle Timeout (Auto Logout for Admins)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let timeoutId;
    const IDLE_TIME = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Auto logout due to inactivity
        logout();
      }, IDLE_TIME);
    };

    // Listeners for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);

    // Initial start
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await authApi.loginUser(email, password);
      if (response.success) {
        if (response.data.status === 'VERIFICATION_REQUIRED') {
          return response.data; // { status, email, customToken }
        }
        // response.data contains { accessToken, user }
        const { user: userData, accessToken } = response.data;
        const fullUser = { ...userData, accessToken };
        setUser(fullUser);
        localStorage.setItem('naturadry_user', JSON.stringify(fullUser));
        return fullUser;
      }
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  const firebaseLogin = async (idToken) => {
    try {
      const response = await authApi.firebaseLogin(idToken);
      if (response.success) {
        const { user: userData, accessToken } = response.data;
        // Firebase login now requires verification too — return status
        if (response.data.status === 'VERIFICATION_REQUIRED') {
          return response.data; // { status, email, customToken }
        }
        const fullUser = { ...userData, accessToken };
        setUser(fullUser);
        localStorage.setItem('naturadry_user', JSON.stringify(fullUser));
        return fullUser;
      }
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  const finalizeLogin = async (idToken) => {
    try {
      const response = await authApi.finalizeLogin(idToken);
      if (response.success) {
        const { user: userData, accessToken } = response.data;
        const fullUser = { ...userData, accessToken };
        setUser(fullUser);
        localStorage.setItem('naturadry_user', JSON.stringify(fullUser));
        return fullUser;
      }
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem('naturadry_user');
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authApi.updateProfile(data);
      if (response.success) {
        setUser(prev => {
          const newUser = { ...prev, ...response.data, accessToken: prev.accessToken };
          localStorage.setItem('naturadry_user', JSON.stringify(newUser));
          return newUser;
        });
      }
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, firebaseLogin, finalizeLogin, logout, updateProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
