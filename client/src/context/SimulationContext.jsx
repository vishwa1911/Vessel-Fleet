import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useAlerts } from './AlertContext';

const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  const { user } = useAuth();
  const { fetchAlertsSummary } = useAlerts();
  const [simulationStatus, setSimulationStatus] = useState({
    isRunning: false,
    intervalMs: 5000,
    tickCount: 0,
    lastTick: null,
    updatedVesselsCount: 0,
    mode: 'DEMO / SIMULATED MARITIME ENGINE',
  });
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/simulation/status');
      setSimulationStatus(res.data.data);
    } catch (err) {
      console.error('[Simulation Error]:', err.message);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // If simulation is running, poll every 3 seconds to update UI metrics
  useEffect(() => {
    if (!simulationStatus.isRunning) return;
    const interval = setInterval(() => {
      fetchStatus();
      fetchAlertsSummary();
    }, 3000);
    return () => clearInterval(interval);
  }, [simulationStatus.isRunning, fetchStatus, fetchAlertsSummary]);

  const startSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/simulation/start', { intervalMs: 4000 });
      setSimulationStatus(res.data.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const stopSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/simulation/stop');
      setSimulationStatus(res.data.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const stepSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/simulation/step');
      await fetchStatus();
      await fetchAlertsSummary();
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    setLoading(true);
    try {
      const res = await api.post('/demo/reset');
      await fetchStatus();
      await fetchAlertsSummary();
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    simulationStatus,
    loading,
    startSimulation,
    stopSimulation,
    stepSimulation,
    resetDemo,
    fetchStatus,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
