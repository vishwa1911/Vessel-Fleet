import React from 'react';

const BADGE_STYLES = {
  // Vessel / Voyage Status
  Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'In Port': 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  'Under Maintenance': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Idle: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  Planned: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'In Progress': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Delayed: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  Cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',

  // Cargo Status
  Booked: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  Loaded: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  'In Transit': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',

  // Maintenance & Priority
  Scheduled: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  Overdue: 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse',
  Low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  Critical: 'bg-rose-500/15 text-rose-400 border-rose-500/40',

  // Alert Severity
  Info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Open: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  Acknowledged: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',

  // Source
  simulated: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  'demo-simulated': 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  measured: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  manual: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  estimated: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
};

export const Badge = ({ status, text, size = 'sm', className = '' }) => {
  const label = text || status;
  const style = BADGE_STYLES[status] || 'bg-slate-700/50 text-slate-300 border-slate-600/50';

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
};

export const SimulationTag = ({ label = 'Demo / Simulated Data' }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50 shadow-sm" title="Demonstration data calculated via internal simulation models. Not live AIS stream.">
      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
      {label}
    </span>
  );
};
