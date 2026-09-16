import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('medisync_token');
      const saved = localStorage.getItem('medisync_user');
      if (!token || !saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.role) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify stored token on initial load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('medisync_token');
      if (token) {
        try {
          const data = await authService.getMe();
          if (data && data.success && data.user && data.user.role) {
            setUser(data.user);
            localStorage.setItem('medisync_user', JSON.stringify(data.user));
          } else {
            setUser(null);
            localStorage.removeItem('medisync_token');
            localStorage.removeItem('medisync_user');
          }
        } catch {
          // Token invalid or expired
          setUser(null);
          localStorage.removeItem('medisync_token');
          localStorage.removeItem('medisync_user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('medisync_user');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data.success && data.token && data.user) {
        localStorage.setItem('medisync_token', data.token);
        localStorage.setItem('medisync_user', JSON.stringify(data.user));
        setUser(data.user);
        setLoading(false);
        return data.user;
      }
      throw new Error(data.message || 'Login failed');
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error.response?.data?.message || error.message || 'Authentication failed. Please verify credentials.';
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      setLoading(false);
      if (data.success) {
        if (data.token && data.user) {
          localStorage.setItem('medisync_token', data.token);
          localStorage.setItem('medisync_user', JSON.stringify(data.user));
          setUser(data.user);
        }
        return data;
      }
      throw new Error(data.message || 'Registration failed');
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Stateless logout: proceed with client cleanup even if network fails
    } finally {
      setUser(null);
      localStorage.removeItem('medisync_token');
      localStorage.removeItem('medisync_user');
    }
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    if (!updatedUserData) return;
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      try {
        localStorage.setItem('medisync_user', JSON.stringify(merged));
      } catch (err) {
        console.warn('Could not save updated user to localStorage', err.message);
      }
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        currentRole: user?.role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
