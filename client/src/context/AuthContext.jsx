import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vesselfleet_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify user from stored token
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('vesselfleet_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch {
          localStorage.removeItem('vesselfleet_token');
          localStorage.removeItem('vesselfleet_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('vesselfleet_token', receivedToken);
    localStorage.setItem('vesselfleet_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('vesselfleet_token');
      localStorage.removeItem('vesselfleet_user');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (...allowedRoles) => {
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin has universal access
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    isAdmin: user?.role === 'Admin',
    isOperator: user?.role === 'Fleet Operator',
    isEngineer: user?.role === 'Marine Engineer',
    isCargoManager: user?.role === 'Cargo Manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
