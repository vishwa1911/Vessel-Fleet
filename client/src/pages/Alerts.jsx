import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Check,
  RefreshCw,
  Clock,
  Ship,
  Compass,
  Package,
  Wrench,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { Badge, SimulationTag } from '../components/common/Badge';
import { ALERT_SEVERITIES } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';

export const Alerts = () => {
  const { user } = useAuth();
  const { fetchAlertsSummary } = useAlerts();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Open');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [message, setMessage] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        status: statusFilter !== 'All' ? statusFilter : undefined,
        severity: severityFilter !== 'All' ? severityFilter : undefined,
        limit: 50,
      };

      const res = await api.get('/alerts', { params });
      setAlerts(res.data.data);
    } catch (err) {
      console.error('[Alerts fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setMessage('');
    try {
      const res = await api.post('/alerts/evaluate');
      setMessage(res.data.message || 'Alert rules evaluation completed.');
      await fetchAlerts();
      await fetchAlertsSummary();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to execute rules engine.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/alerts/${id}/acknowledge`);
      await fetchAlerts();
      await fetchAlertsSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to acknowledge alert.');
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/alerts/${id}/resolve`);
      await fetchAlerts();
      await fetchAlertsSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve alert.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Centralized Operational Alerts & Advisory Engine
            </h1>
            <SimulationTag />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated detection of schedule delays, bunker fuel overuse, overdue maintenance, route deviation, and cargo delivery risks.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={evaluating}
          className="flex items-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-500 text-white font-medium text-xs rounded-lg transition shadow-md shadow-ocean-600/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
          <span>{evaluating ? 'Evaluating Fleet Rules...' : 'Re-Evaluate Alert Rules Now'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-ocean-500/10 border border-ocean-500/30 rounded-lg text-ocean-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-maritime-900 border border-slate-700/80 rounded-lg p-1 text-xs">
            {['Open', 'Acknowledged', 'Resolved', 'All'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${
                  statusFilter === st
                    ? 'bg-ocean-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-maritime-900 border border-slate-700/80 rounded-lg text-xs text-white"
          >
            <option value="All">All Severities</option>
            {ALERT_SEVERITIES.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{alerts.length}</span> alert condition(s)
        </span>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-xl border border-slate-800 animate-pulse h-28" />
          ))
        ) : alerts.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-400 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h3 className="font-bold text-white text-base">No Matching Alerts</h3>
            <p className="text-xs text-slate-400 mt-1">
              All monitored vessel parameters, voyage schedules, and cargo status are within normal operational limits.
            </p>
          </div>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt._id}
              className={`glass-panel p-5 rounded-xl border transition-all ${
                alt.status === 'Resolved'
                  ? 'border-slate-800/80 opacity-70'
                  : alt.severity === 'Critical'
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : alt.severity === 'High'
                  ? 'border-orange-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-sm font-bold ${
                        alt.severity === 'Critical'
                          ? 'text-rose-400'
                          : alt.severity === 'High'
                          ? 'text-orange-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {alt.type}
                    </span>
                    <Badge status={alt.severity} size="xs" />
                    <Badge status={alt.status} size="xs" />
                    <span className="text-[11px] text-slate-400">
                      Logged {formatDateTime(alt.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-white">{alt.reason}</p>

                  {/* Operational Recommendation Box */}
                  <div className="p-3 rounded-lg bg-maritime-950/80 border border-slate-800/80 text-xs text-slate-300">
                    <span className="font-semibold text-ocean-400">Recommended Action: </span>
                    {alt.recommendedAction}
                  </div>

                  {/* Related Links */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    {alt.vessel && (
                      <Link
                        to={`/vessels/${alt.vessel._id}`}
                        className="inline-flex items-center gap-1 text-slate-300 hover:text-ocean-400"
                      >
                        <Ship className="w-3.5 h-3.5" />
                        <span>Vessel: {alt.vessel.name}</span>
                      </Link>
                    )}
                    {alt.voyage && (
                      <Link
                        to={`/voyages/${alt.voyage._id}`}
                        className="inline-flex items-center gap-1 text-slate-300 hover:text-ocean-400"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Voyage: {alt.voyage.voyageNo}</span>
                      </Link>
                    )}
                    {alt.cargo && (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Package className="w-3.5 h-3.5" />
                        <span>Shipment: {alt.cargo.shipmentNo}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {alt.status === 'Open' && (
                    <button
                      onClick={() => handleAcknowledge(alt._id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alt.status !== 'Resolved' && (
                    <button
                      onClick={() => handleResolve(alt._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}

                  {alt.status === 'Resolved' && alt.resolvedBy && (
                    <span className="text-[11px] text-slate-400 italic">
                      Resolved by {alt.resolvedBy.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
