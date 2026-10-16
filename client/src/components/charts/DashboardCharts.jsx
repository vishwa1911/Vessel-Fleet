import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2.5 rounded-xl border border-sky-100 text-xs shadow-xl">
        <p className="font-bold text-slate-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
            <span>{entry.name}:</span>
            <span className="font-bold">
              {entry.name.toLowerCase().includes('cost')
                ? formatCurrency(entry.value)
                : `${formatNumber(entry.value)} ${unit}`}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const FleetUtilizationChart = ({ data = [] }) => {
  return (
    <div className="glass-panel p-5 rounded-xl border border-sky-100 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Fleet Availability by Vessel Type</h3>
          <p className="text-xs text-slate-500">Active vs In Port vs Under Maintenance</p>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
            <XAxis
              dataKey="type"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              angle={-20}
              textAnchor="end"
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip unit="vessels" />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar dataKey="active" name="Active at Sea" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="inPort" name="In Port" fill="#0ea5e9" stackId="a" />
            <Bar dataKey="maintenance" name="Under Maintenance" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PlannedVsActualChart = ({ data = [] }) => {
  return (
    <div className="glass-panel p-5 rounded-xl border border-sky-100 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Voyage Fuel Variance (Planned vs Actual)</h3>
          <p className="text-xs text-slate-500">Variance analysis on key maritime voyages</p>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
            <XAxis
              dataKey="voyageNo"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              angle={-25}
              textAnchor="end"
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip unit="MT" />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
            <Bar dataKey="plannedFuel" name="Planned Fuel (MT)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actualFuelEstimated" name="Actual / Burned (MT)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const FuelTrendChart = ({ data = [] }) => {
  return (
    <div className="glass-panel p-5 rounded-xl border border-sky-100 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Bunker Fuel Consumption Trend</h3>
          <p className="text-xs text-slate-500">Daily fuel consumption volume (Metric Tons)</p>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              angle={-25}
              textAnchor="end"
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip unit="MT" />} />
            <Line
              type="monotone"
              dataKey="fuelTons"
              name="Fuel (MT)"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0ea5e9' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CostBreakdownChart = ({ data = [] }) => {
  const COLORS = ['#0ea5e9', '#38bdf8', '#0284c7', '#f59e0b', '#8b5cf6'];

  return (
    <div className="glass-panel p-5 rounded-xl border border-sky-100 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Operational Cost Distribution</h3>
          <p className="text-xs text-slate-500">Bunker fuel vs fleet maintenance activities</p>
        </div>
      </div>
      <div className="h-64 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val) => formatCurrency(val)}
              contentStyle={{ background: '#ffffff', borderColor: '#bae6fd', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.2)' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
