import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch full user profile from PostgreSQL to get roles, addresses, etc
          const response = await authApi.getProfile();
          if (response.success) {
            setUser({ ...firebaseUser, ...response.data });
          } else {
             setUser(firebaseUser);
          }
        } catch (error) {
          // If profile fetch fails (e.g. backend down), we still keep firebase user
          setUser(firebaseUser); 
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
      const response = await authApi.login(email, password);
      if (response.success && response.data.customToken) {
        const { signInWithCustomToken } = await import('firebase/auth');
        const userCredential = await signInWithCustomToken(auth, response.data.customToken);
        const idToken = await userCredential.user.getIdToken();
        const syncResponse = await authApi.firebaseLogin(idToken);
        if (syncResponse.success) {
          setUser({ ...auth.currentUser, ...syncResponse.data.user });
          return syncResponse.data.user;
        }
      }
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  const firebaseLogin = async (idToken, profileData) => {
    try {
      const response = await authApi.firebaseLogin(idToken, profileData);
      if (response.success) {
        // Firebase login now requires verification too — return status
        if (response.data.status === 'VERIFICATION_REQUIRED') {
          return response.data; // { status, email, customToken }
        }
        setUser({ ...auth.currentUser, ...response.data.user });
        return response.data.user;
      }
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  const finalizeLogin = async (idToken) => {
    try {
      const response = await authApi.finalizeLogin(idToken);
      if (response.success) {
        setUser({ ...auth.currentUser, ...response.data.user });
        return response.data.user;
      }
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authApi.updateProfile(data);
      if (response.success) {
        setUser(prev => ({ ...prev, ...response.data }));
        return response;
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

