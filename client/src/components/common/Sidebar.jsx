import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ship,
  Compass,
  Fuel,
  Wrench,
  Package,
  Bell,
  Sliders,
  Users,
  Anchor,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, hasRole, isAdmin } = useAuth();
  const { unreadCount } = useAlerts();

  const navigationItems = [
    {
      name: 'Fleet Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Fleet Operator', 'Marine Engineer', 'Cargo Manager'],
    },
    {
      name: 'Vessels Registry',
      path: '/vessels',
      icon: Ship,
      roles: ['Admin', 'Fleet Operator', 'Marine Engineer'],
    },
    {
      name: 'Voyages & Routes',
      path: '/voyages',
      icon: Compass,
      roles: ['Admin', 'Fleet Operator', 'Cargo Manager'],
    },
    {
      name: 'Fuel Analytics',
      path: '/fuel',
      icon: Fuel,
      roles: ['Admin', 'Marine Engineer', 'Fleet Operator'],
    },
    {
      name: 'Maintenance & Risk',
      path: '/maintenance',
      icon: Wrench,
      roles: ['Admin', 'Marine Engineer'],
    },
    {
      name: 'Cargo Shipments',
      path: '/cargo',
      icon: Package,
      roles: ['Admin', 'Cargo Manager', 'Fleet Operator'],
    },
    {
      name: 'Alerts & Actions',
      path: '/alerts',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      roles: ['Admin', 'Fleet Operator', 'Marine Engineer', 'Cargo Manager'],
    },
    {
      name: 'System Settings',
      path: '/settings',
      icon: Sliders,
      roles: ['Admin'],
    },
    {
      name: 'User Management',
      path: '/users',
      icon: Users,
      roles: ['Admin'],
    },
  ];

  // Filter items based on user role
  const visibleItems = navigationItems.filter((item) =>
    hasRole(...item.roles)
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-maritime-900 border-r border-slate-800 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-gradient-to-br from-ocean-500 to-teal-500 text-white shadow-md shadow-ocean-500/20">
              <Anchor className="w-5 h-5 flex-shrink-0" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                  Vessel<span className="text-ocean-400">Fleet</span>
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  Maritime Ops Center
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-ocean-600 text-white shadow-md shadow-ocean-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}
                {item.badge != null && (
                  <span
                    className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${
                      collapsed
                        ? 'absolute top-1 right-1 w-2 h-2 p-0 bg-rose-500 rounded-full'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {!collapsed && item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info */}
      <div className="p-3 border-t border-slate-800 bg-maritime-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center font-bold text-xs text-ocean-300 flex-shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VF'}
          </div>
          {!collapsed && (
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <span className="inline-block px-2 py-0.5 mt-0.5 text-[10px] font-medium rounded bg-ocean-500/20 text-ocean-300 border border-ocean-500/30">
                {user?.role}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
