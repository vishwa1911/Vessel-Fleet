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
    ocean: 'border-sky-200 text-sky-600 bg-sky-50',
    emerald: 'border-emerald-200 text-emerald-600 bg-emerald-50',
    amber: 'border-amber-200 text-amber-600 bg-amber-50',
    rose: 'border-rose-200 text-rose-600 bg-rose-50',
    purple: 'border-purple-200 text-purple-600 bg-purple-50',
    teal: 'border-sky-200 text-sky-700 bg-sky-50',
  };

  const activeColor = colorStyles[color] || colorStyles.ocean;

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-xl transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-sky-300 hover:shadow-sky-glow hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight font-sans">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${activeColor} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-medium">
          {trend && (
            <span
              className={`font-semibold ${
                trendPositive ? 'text-emerald-600' : 'text-rose-600'
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
