import React, { useState, useEffect, useCallback } from 'react';
import {
  Ship,
  Compass,
  Wrench,
  AlertTriangle,
  Fuel,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { FleetMap } from '../components/map/FleetMap';
import {
  FleetUtilizationChart,
  PlannedVsActualChart,
  FuelTrendChart,
  CostBreakdownChart,
} from '../components/charts/DashboardCharts';
import { Badge, SimulationTag } from '../components/common/Badge';
import { formatCurrency, formatNumber, formatDateTime, formatDate } from '../utils/formatters';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days'); // 'all', '30days', '7days'

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      let startDate = '';
      const now = new Date();
      if (dateRange === '7days') {
        startDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
      } else if (dateRange === '30days') {
        startDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
      }

      const params = startDate ? { startDate } : {};

      const [summaryRes, chartsRes] = await Promise.all([
        api.get('/dashboard/summary', { params }),
        api.get('/dashboard/charts', { params }),
      ]);

      setSummary(summaryRes.data.data);
      setCharts(chartsRes.data.data);
    } catch (err) {
      console.error('[Dashboard fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const kpi = summary?.kpi;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fleet Operations & Intelligence Control
            </h1>
            <SimulationTag />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time telemetry, MongoDB aggregated metrics, voyage scheduling, and automated rule-based alerts.
          </p>
        </div>

        {/* Date Range Filter & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-sky-200 rounded-xl p-1 text-xs shadow-sm">
            <button
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                dateRange === '7days'
                  ? 'bg-sky-500 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-sky-600'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                dateRange === '30days'
                  ? 'bg-sky-500 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-sky-600'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                dateRange === 'all'
                  ? 'bg-sky-500 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-sky-600'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-slate-600 hover:text-sky-600 transition shadow-sm"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Fleet"
          value={kpi ? kpi.totalVessels : '—'}
          subtitle={`${kpi?.activeVessels || 0} underway at sea`}
          icon={Ship}
          color="ocean"
        />
        <MetricCard
          title="Active Voyages"
          value={kpi ? kpi.activeVoyages : '—'}
          subtitle={`${kpi?.delayedVoyages || 0} delayed`}
          icon={Compass}
          color="teal"
        />
        <MetricCard
          title="Fleet Availability"
          value={kpi ? `${kpi.fleetAvailabilityPercent}%` : '—'}
          subtitle="Target: ≥ 75%"
          trendPositive={kpi?.fleetAvailabilityPercent >= 75}
          trend={kpi?.fleetAvailabilityPercent >= 75 ? 'Optimal' : 'Low'}
          icon={TrendingUp}
          color={kpi?.fleetAvailabilityPercent >= 75 ? 'emerald' : 'amber'}
        />
        <MetricCard
          title="In Maintenance"
          value={kpi ? kpi.vesselsUnderMaintenance : '—'}
          subtitle={`${kpi?.overdueMaintenanceTasks || 0} overdue tasks`}
          icon={Wrench}
          color={kpi?.vesselsUnderMaintenance > 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          title="Total Bunker Fuel"
          value={kpi ? `${formatNumber(kpi.totalFuelTons)} MT` : '—'}
          subtitle="Heavy & Light Fuel"
          icon={Fuel}
          color="purple"
        />
        <MetricCard
          title="Est. Fuel Cost"
          value={kpi ? formatCurrency(kpi.totalFuelCost) : '—'}
          subtitle={`Op Cost: ${formatCurrency(kpi?.totalOperatingCost || 0)}`}
          icon={DollarSign}
          color="ocean"
        />
      </div>

      {/* Interactive Global Fleet Map */}
      <FleetMap vessels={summary?.fleetLocations || []} height="480px" />

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FleetUtilizationChart data={charts?.fleetUtilization || []} />
        <PlannedVsActualChart data={charts?.plannedVsActual || []} />
        <FuelTrendChart data={charts?.fuelTrend || []} />
        <CostBreakdownChart data={charts?.operationalCostBreakdown || []} />
      </div>

      {/* Lower Multi-Column Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cargo Status Breakdown */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-ocean-400" />
                <h3 className="font-semibold text-white text-sm">Cargo Logistics Flow</h3>
              </div>
              <Link to="/cargo" className="text-xs text-ocean-400 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {(summary?.cargoBreakdown || []).map((c) => (
                <div key={c.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge status={c.status} size="xs" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-200">{c.count} shipments</span>
                    <span className="text-slate-400 ml-2">({formatNumber(c.weightTons)} MT)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            Total Cargo under manifest: <span className="font-bold text-white">{kpi?.totalShipments || 0} shipments</span>
          </div>
        </div>

        {/* Upcoming Arrivals & Departures */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <h3 className="font-semibold text-white text-sm">Port Movements Schedule</h3>
            </div>
            <Link to="/voyages" className="text-xs text-ocean-400 hover:underline">
              Voyages &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Upcoming Arrivals
            </p>
            {(summary?.upcomingArrivals || []).slice(0, 3).map((v) => (
              <div
                key={v._id}
                className="p-2.5 rounded-lg bg-maritime-950/50 border border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>{v.vessel?.name || 'Vessel'}</span>
                    <span className="text-[10px] text-slate-400">({v.voyageNo})</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {v.origin?.name} &rarr; <span className="text-ocean-400 font-medium">{v.destination?.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 font-medium">{formatDate(v.estimatedArrival)}</div>
                  <Badge status={v.status} size="xs" />
                </div>
              </div>
            ))}

            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 pt-2">
              Upcoming Departures
            </p>
            {(summary?.upcomingDepartures || []).slice(0, 2).map((v) => (
              <div
                key={v._id}
                className="p-2.5 rounded-lg bg-maritime-950/50 border border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>{v.vessel?.name}</span>
                    <span className="text-[10px] text-slate-400">({v.voyageNo})</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Origin: {v.origin?.name}
                  </div>
                </div>
                <div className="text-right text-slate-300">
                  {formatDate(v.departureDate)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Open Alerts */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-white text-sm">Rule-based Alerts Feed</h3>
              </div>
              <Link to="/alerts" className="text-xs text-ocean-400 hover:underline">
                Resolve &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {(summary?.latestAlerts || []).slice(0, 4).map((alt) => (
                <div
                  key={alt._id}
                  className="p-2.5 rounded-lg bg-maritime-950/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-rose-300">{alt.type}</span>
                    <Badge status={alt.severity} size="xs" />
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-2">{alt.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <Link
              to="/alerts"
              className="w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-sky-500/20"
            >
              <span className="text-white">Manage & Acknowledge All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
