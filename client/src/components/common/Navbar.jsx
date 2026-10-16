import React, { useState } from 'react';
import {
  Bell,
  Play,
  Square,
  FastForward,
  RotateCcw,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { useSimulation } from '../../context/SimulationContext';
import { ConfirmDialog } from './Modal';
import { formatDateTime } from '../../utils/formatters';

export const Navbar = ({ sidebarCollapsed }) => {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount, recentAlerts } = useAlerts();
  const {
    simulationStatus,
    startSimulation,
    stopSimulation,
    stepSimulation,
    resetDemo,
    loading: simLoading,
  } = useSimulation();

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isSimRunning = simulationStatus?.isRunning;

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm transition-all duration-300 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Operations Status / Simulation Controller */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-100 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSimRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-slate-700">
              SIMULATION ENGINE:{' '}
              <span className={isSimRunning ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium'}>
                {isSimRunning ? 'LIVE (PROGRESSING)' : 'PAUSED'}
              </span>
            </span>
          </div>

          {/* Admin Simulation Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              {isSimRunning ? (
                <button
                  onClick={stopSimulation}
                  disabled={simLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
                  title="Pause Route Simulation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={startSimulation}
                  disabled={simLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-50"
                  title="Start Real-time Route Simulation"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Sim</span>
                </button>
              )}

              <button
                onClick={stepSimulation}
                disabled={simLoading || isSimRunning}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition disabled:opacity-40"
                title="Advance simulation by 1 discrete step"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Step</span>
              </button>

              <button
                onClick={() => setResetDialogOpen(true)}
                disabled={simLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                title="Reset database to fresh maritime demo dataset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-4">
          {/* Alerts Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAlertsOpen(!alertsOpen)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition"
              title="Operational Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Quick Dropdown */}
            {alertsOpen && (
              <div className="absolute right-0 mt-2 w-80 glass-panel bg-white border border-sky-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                      Active Alerts ({unreadCount})
                    </span>
                  </div>
                  <Link
                    to="/alerts"
                    onClick={() => setAlertsOpen(false)}
                    className="text-xs text-sky-600 font-semibold hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-sky-50">
                  {recentAlerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-80" />
                      No active operational alerts. Fleet parameters normal.
                    </div>
                  ) : (
                    recentAlerts.map((alt) => (
                      <div
                        key={alt._id}
                        onClick={() => {
                          setAlertsOpen(false);
                          navigate('/alerts');
                        }}
                        className="p-3 hover:bg-sky-50/60 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-semibold ${
                              alt.severity === 'Critical'
                                ? 'text-rose-600'
                                : alt.severity === 'High'
                                ? 'text-orange-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {alt.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(alt.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">{alt.reason}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-sky-50/70 border-t border-sky-100 text-center">
                  <Link
                    to="/alerts"
                    onClick={() => setAlertsOpen(false)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    Open Alert Resolution Center &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-sky-50 transition"
            >
              <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VF'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  {user?.role}
                </p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-panel bg-white border border-sky-100 rounded-xl shadow-xl z-50 p-2">
                <div className="px-3 py-2 border-b border-sky-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-100 text-sky-700">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Demo Reset Dialog */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={resetDemo}
        title="Reset Maritime Demo Database?"
        message="This will re-initialize the MongoDB database with standard sample data (~12 vessels, 20 voyages, 30 cargo shipments, fuel logs, and maintenance tasks). Any custom records created during testing will be refreshed."
        confirmText="Reset Demo Data"
        danger={true}
      />
    </header>
  );
};
