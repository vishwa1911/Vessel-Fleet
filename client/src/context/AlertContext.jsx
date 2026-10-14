import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [evaluating, setEvaluating] = useState(false);

  const fetchAlertsSummary = useCallback(async () => {
    if (!user) return;
    try {
      const [countRes, alertsRes] = await Promise.all([
        api.get('/alerts/unread-count'),
        api.get('/alerts?status=Open&limit=5'),
      ]);
      setUnreadCount(countRes.data.count || 0);
      setRecentAlerts(alertsRes.data.data || []);
    } catch (err) {
      console.error('[AlertContext Error]:', err.message);
    }
  }, [user]);

  useEffect(() => {
    fetchAlertsSummary();
    const interval = setInterval(fetchAlertsSummary, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, [fetchAlertsSummary]);

  const triggerEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await api.post('/alerts/evaluate');
      await fetchAlertsSummary();
      return res.data;
    } finally {
      setEvaluating(false);
    }
  };

  const acknowledgeAlert = async (id) => {
    const res = await api.put(`/alerts/${id}/acknowledge`);
    await fetchAlertsSummary();
    return res.data;
  };

  const resolveAlert = async (id) => {
    const res = await api.put(`/alerts/${id}/resolve`);
    await fetchAlertsSummary();
    return res.data;
  };

  const value = {
    unreadCount,
    recentAlerts,
    evaluating,
    fetchAlertsSummary,
    triggerEvaluation,
    acknowledgeAlert,
    resolveAlert,
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
