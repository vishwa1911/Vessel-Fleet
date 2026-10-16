import React from 'react';

const BADGE_STYLES = {
  // Vessel / Voyage Status
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Port': 'bg-sky-50 text-sky-700 border-sky-200',
  'Under Maintenance': 'bg-amber-50 text-amber-700 border-amber-200',
  Idle: 'bg-slate-100 text-slate-700 border-slate-200',
  Planned: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Delayed: 'bg-rose-50 text-rose-700 border-rose-200',
  Cancelled: 'bg-zinc-100 text-zinc-700 border-zinc-200',

  // Cargo Status
  Booked: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Loaded: 'bg-sky-50 text-sky-700 border-sky-200',
  'In Transit': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Maintenance & Priority
  Scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
  Overdue: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',

  // Alert Severity
  Info: 'bg-blue-50 text-blue-700 border-blue-200',
  Warning: 'bg-amber-50 text-amber-700 border-amber-200',
  Open: 'bg-rose-50 text-rose-700 border-rose-200',
  Acknowledged: 'bg-amber-50 text-amber-700 border-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Source
  simulated: 'bg-sky-50 text-sky-700 border-sky-200',
  'demo-simulated': 'bg-sky-50 text-sky-700 border-sky-200',
  measured: 'bg-teal-50 text-teal-700 border-teal-200',
  manual: 'bg-blue-50 text-blue-700 border-blue-200',
  estimated: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const Badge = ({ status, text, size = 'sm', className = '' }) => {
  const label = text || status;
  const style = BADGE_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';

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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-sky-50 text-sky-700 border border-sky-200 shadow-sm" title="Demonstration data calculated via internal simulation models. Not live AIS stream.">
      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
      {label}
    </span>
  );
};
