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
      className={`fixed top-0 right-0 z-30 h-16 bg-maritime-900/90 backdrop-blur-md border-b border-slate-800 transition-all duration-300 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Operations Status / Simulation Controller */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-maritime-950/80 border border-slate-800 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSimRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="font-semibold text-slate-300">
              SIMULATION ENGINE:{' '}
              <span className={isSimRunning ? 'text-emerald-400' : 'text-slate-400'}>
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
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition disabled:opacity-50"
                  title="Pause Route Simulation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={startSimulation}
                  disabled={simLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition disabled:opacity-50"
                  title="Start Real-time Route Simulation"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Sim</span>
                </button>
              )}

              <button
                onClick={stepSimulation}
                disabled={simLoading || isSimRunning}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-ocean-500/20 text-ocean-300 border border-ocean-500/30 hover:bg-ocean-500/30 transition disabled:opacity-40"
                title="Advance simulation by 1 discrete step"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Step</span>
              </button>

              <button
                onClick={() => setResetDialogOpen(true)}
                disabled={simLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition disabled:opacity-50"
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
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
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
              <div className="absolute right-0 mt-2 w-80 glass-panel bg-maritime-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-xs text-white uppercase tracking-wider">
                      Active Alerts ({unreadCount})
                    </span>
                  </div>
                  <Link
                    to="/alerts"
                    onClick={() => setAlertsOpen(false)}
                    className="text-xs text-ocean-400 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {recentAlerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1 opacity-80" />
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
                        className="p-3 hover:bg-slate-800/40 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-semibold ${
                              alt.severity === 'Critical'
                                ? 'text-rose-400'
                                : alt.severity === 'High'
                                ? 'text-orange-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {alt.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(alt.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-300 line-clamp-2">{alt.reason}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-maritime-950/60 border-t border-slate-800 text-center">
                  <Link
                    to="/alerts"
                    onClick={() => setAlertsOpen(false)}
                    className="text-xs font-semibold text-ocean-400 hover:text-ocean-300"
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
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 transition"
            >
              <div className="w-8 h-8 rounded-full bg-ocean-600/30 border border-ocean-500/50 flex items-center justify-center text-ocean-300 font-bold text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VF'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-white truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {user?.role}
                </p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-panel bg-maritime-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-2">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-ocean-500/20 text-ocean-300">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
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
