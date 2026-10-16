import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  AlertTriangle,
  Clock,
  Compass,
  TrendingDown,
  ShieldCheck,
  CheckCircle,
  Save,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SimulationTag } from '../components/common/Badge';

export const Settings = () => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState({
    fuelPricePerTon: 650,
    fuelOverusePercent: 15,
    delayThresholdHours: 12,
    routeDeviationNm: 50,
    minFleetAvailabilityPercent: 75,
    maintenanceHoursWarningPercent: 90,
    maintenanceDueSoonDays: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        setSettings(res.data.data);
      })
      .catch((err) => {
        console.error('[Settings fetch error]:', err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await api.put('/settings', {
        fuelPricePerTon: Number(settings.fuelPricePerTon),
        fuelOverusePercent: Number(settings.fuelOverusePercent),
        delayThresholdHours: Number(settings.delayThresholdHours),
        routeDeviationNm: Number(settings.routeDeviationNm),
        minFleetAvailabilityPercent: Number(settings.minFleetAvailabilityPercent),
        maintenanceHoursWarningPercent: Number(settings.maintenanceHoursWarningPercent),
        maintenanceDueSoonDays: Number(settings.maintenanceDueSoonDays),
      });

      setSettings(res.data.data);
      setSuccess('Operational thresholds updated successfully. Alert rules re-evaluated.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 text-center text-slate-500 rounded-xl border border-sky-100 shadow-sm animate-pulse">
        Loading system configuration parameters...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Operational Settings</h1>
          <SimulationTag />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure baseline pricing, advisory threshold limits, and trigger conditions for the centralized alert engine.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bunker Pricing Configuration */}
        <div className="bg-white p-6 rounded-xl border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-sky-100 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Bunker Fuel Pricing Benchmark</h3>
              <p className="text-xs text-slate-500">Default market pricing applied to fuel consumption</p>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Fuel Price Per Metric Ton (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.fuelPricePerTon}
                onChange={(e) => setSettings({ ...settings, fuelPricePerTon: e.target.value })}
                className="w-full pl-7 pr-4 py-2 bg-white border border-sky-200 rounded-lg text-sm text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Used to derive voyage cost analytics.</p>
          </div>
        </div>

        {/* Central Rules Engine Thresholds */}
        <div className="bg-white p-6 rounded-xl border border-sky-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-sky-100 pb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Alert Rules Engine Thresholds</h3>
              <p className="text-xs text-slate-500">Define operational limits that trigger automated alerts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Delay Threshold */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Voyage Delay Threshold (Hours)
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.delayThresholdHours}
                onChange={(e) => setSettings({ ...settings, delayThresholdHours: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Trigger DelayedArrival alert when voyage ETA slips beyond this limit.
              </p>
            </div>

            {/* Fuel Overuse % */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fuel Overuse Variance (%)
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.fuelOverusePercent}
                onChange={(e) => setSettings({ ...settings, fuelOverusePercent: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Trigger HighFuel alert when consumption exceeds planned baseline by this %.
              </p>
            </div>

            {/* Route Deviation Distance */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Route Deviation Corridor (Nautical Miles)
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.routeDeviationNm}
                onChange={(e) => setSettings({ ...settings, routeDeviationNm: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Trigger RouteDeviation alert when cross-track distance exceeds this threshold.
              </p>
            </div>

            {/* Minimum Fleet Availability */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Minimum Fleet Availability (%)
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.minFleetAvailabilityPercent}
                onChange={(e) =>
                  setSettings({ ...settings, minFleetAvailabilityPercent: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Trigger LowAvailability alert when active fleet percentage drops below this value.
              </p>
            </div>

            {/* Maintenance Warning Percent */}
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Engine Running Hours Warning (%)
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.maintenanceHoursWarningPercent}
                onChange={(e) =>
                  setSettings({ ...settings, maintenanceHoursWarningPercent: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Flag early maintenance advisory when engine hours reach this % of threshold.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-lg transition shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Thresholds...' : 'Save System Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
