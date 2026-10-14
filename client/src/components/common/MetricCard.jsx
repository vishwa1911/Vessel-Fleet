import React from 'react';

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  color = 'ocean',
  onClick,
}) => {
  const colorStyles = {
    ocean: 'border-ocean-500/20 text-ocean-400 bg-ocean-500/10',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/10',
    purple: 'border-purple-500/20 text-purple-400 bg-purple-500/10',
    teal: 'border-teal-500/20 text-teal-400 bg-teal-500/10',
  };

  const activeColor = colorStyles[color] || colorStyles.ocean;

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-xl transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-ocean-500/40 hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight font-sans">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${activeColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          {trend && (
            <span
              className={`font-semibold ${
                trendPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
