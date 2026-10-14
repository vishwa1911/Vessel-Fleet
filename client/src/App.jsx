import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { SimulationProvider } from './context/SimulationContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vessels } from './pages/Vessels';
import { VesselDetail } from './pages/VesselDetail';
import { Voyages } from './pages/Voyages';
import { VoyageDetail } from './pages/VoyageDetail';
import { FuelAnalytics } from './pages/FuelAnalytics';
import { Maintenance } from './pages/Maintenance';
import { Cargo } from './pages/Cargo';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { NotFound } from './pages/NotFound';

// Protected Route Guard with RBAC
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-maritime-950 flex items-center justify-center text-ocean-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-slate-400">Verifying Credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Application Layout Shell
const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-maritime-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Top Bar Header */}
      <Navbar sidebarCollapsed={collapsed} />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 pt-20 pb-12 px-6 min-h-screen ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>
          <SimulationProvider>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/vessels"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Fleet Operator', 'Marine Engineer']}>
                    <AppLayout>
                      <Vessels />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/vessels/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Fleet Operator', 'Marine Engineer']}>
                    <AppLayout>
                      <VesselDetail />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/voyages"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Fleet Operator', 'Cargo Manager']}>
                    <AppLayout>
                      <Voyages />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/voyages/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Fleet Operator', 'Cargo Manager']}>
                    <AppLayout>
                      <VoyageDetail />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/fuel"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Marine Engineer', 'Fleet Operator']}>
                    <AppLayout>
                      <FuelAnalytics />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/maintenance"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Marine Engineer']}>
                    <AppLayout>
                      <Maintenance />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cargo"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Cargo Manager', 'Fleet Operator']}>
                    <AppLayout>
                      <Cargo />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Alerts />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AppLayout>
                      <Users />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SimulationProvider>
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
