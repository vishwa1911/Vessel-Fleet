import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Ship,
  MapPin,
  Calendar,
  Clock,
  Fuel,
  Package,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { Badge, SimulationTag } from '../components/common/Badge';
import { RouteMap } from '../components/map/RouteMap';
import { formatNumber, formatCurrency, formatDate, formatDateTime, formatCoordinates } from '../utils/formatters';

export const VoyageDetail = () => {
  const { id } = useParams();
  const [voyage, setVoyage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVoyage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/voyages/${id}`);
      setVoyage(res.data.data);
    } catch (err) {
      console.error('[VoyageDetail fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVoyage();
  }, [fetchVoyage]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-40 bg-slate-800 rounded-xl" />
        <div className="h-96 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!voyage) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400 rounded-xl">
        <p>Voyage record not found.</p>
        <Link to="/voyages" className="mt-3 inline-block text-ocean-400 hover:underline text-xs">
          &larr; Back to Voyages
        </Link>
      </div>
    );
  }

  const v = voyage;
  const metrics = v.actualMetrics || {};
  const currentPos = v.vessel?.lastKnownPosition;
  const deviation = metrics.currentDeviationNm || 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/voyages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-400 hover:text-ocean-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Voyages</span>
        </Link>
      </div>

      {/* Voyage Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-500/20 to-teal-500/20 border border-ocean-500/30 flex items-center justify-center text-ocean-400">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">{v.voyageNo}</h1>
              <Badge status={v.status} size="md" />
              <SimulationTag />
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span className="font-semibold text-white">{v.origin?.name}</span> &rarr;{' '}
              <span className="font-semibold text-ocean-400">{v.destination?.name}</span>
              &bull; Assigned Vessel:{' '}
              {v.vessel ? (
                <Link to={`/vessels/${v.vessel._id}`} className="text-ocean-400 hover:underline font-semibold">
                  {v.vessel.name}
                </Link>
              ) : (
                'None'
              )}
            </p>
          </div>
        </div>

        {/* Progress & Delay Indicator */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Transit Progress
            </p>
            <div className="text-2xl font-black text-white mt-0.5">{v.progressPercent || 0}%</div>
            <div className="w-32 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-ocean-500 rounded-full transition-all"
                style={{ width: `${v.progressPercent || 0}%` }}
              />
            </div>
          </div>

          {v.delayHours > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Schedule Delay: +{v.delayHours} hrs
              </p>
              <p className="text-[11px] text-rose-400 mt-0.5">
                Past planned arrival schedule
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-3.5 rounded-xl bg-maritime-900/80 border border-slate-800 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-ocean-400 flex-shrink-0 mt-0.5" />
        <div className="text-slate-300">
          <span className="font-semibold text-white">Demonstration Calculation Notice:</span> Great-circle route distances, estimated times of arrival (ETA), and waypoint paths are simulated mathematical models for demonstration purposes. Vessel telemetry is tagged as simulated.
        </div>
      </div>

      {/* Planned vs Actual Variance KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Route Distance (NM)
          </span>
          <div className="text-xl font-bold text-white mt-1">
            {formatNumber(v.plannedDistanceNm)} NM
          </div>
          <span className="text-[11px] text-slate-400">Great-circle corridor</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Planned Fuel Allocation
          </span>
          <div className="text-xl font-bold text-white mt-1">
            {formatNumber(v.plannedFuelTons)} MT
          </div>
          <span className="text-[11px] text-slate-400">Baseline allocation</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Actual Fuel Burned
          </span>
          <div className="text-xl font-bold text-white mt-1">
            {formatNumber(metrics.totalActualFuel)} MT
          </div>
          <span
            className={`text-[11px] font-semibold ${
              metrics.varianceFuelTons > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            Variance: {metrics.varianceFuelTons > 0 ? `+${metrics.varianceFuelTons}` : metrics.varianceFuelTons} MT
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Current Route Deviation
          </span>
          <div className={`text-xl font-bold mt-1 ${deviation > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {deviation.toFixed(1)} NM
          </div>
          <span className="text-[11px] text-slate-400">
            {deviation > 50 ? 'Threshold exceeded (>50 NM)' : 'Within safe route corridor'}
          </span>
        </div>
      </div>

      {/* Interactive Route Polyline Map */}
      <RouteMap
        origin={v.origin}
        destination={v.destination}
        waypoints={v.waypoints || []}
        currentPosition={currentPos}
        vesselName={v.vessel?.name}
        height="480px"
        deviationNm={deviation}
      />

      {/* Lower Row: Manifest Cargo Shipments & Recent Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manifest Cargo */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-ocean-400" />
              <h3 className="font-semibold text-white text-sm">
                Manifest Cargo Shipments ({v.cargoShipments?.length || 0})
              </h3>
            </div>
            <Link to="/cargo" className="text-xs text-ocean-400 hover:underline">
              Cargo Manager &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {(v.cargoShipments || []).length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No cargo shipments booked on this voyage.</p>
            ) : (
              (v.cargoShipments || []).map((cg) => (
                <div
                  key={cg._id}
                  className="p-3 rounded-lg bg-maritime-950/60 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white">{cg.shipmentNo}</span>
                    <p className="text-slate-300 text-[11px]">{cg.cargoType}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-200">{formatNumber(cg.weightTons)} MT</span>
                    <div className="mt-0.5">
                      <Badge status={cg.status} size="xs" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Position Reports Breadcrumb Log */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h3 className="font-semibold text-white text-sm">
                Position Telemetry Breadcrumbs ({v.positions?.length || 0})
              </h3>
            </div>
            <SimulationTag label="Simulated Log" />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(v.positions || []).length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No position reports logged yet.</p>
            ) : (
              (v.positions || []).map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-maritime-950/50 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-white">
                      {formatCoordinates(p.lat, p.lng)}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Heading: {p.heading || 0}° &bull; Speed: {p.speedKnots} kn
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    {formatDateTime(p.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
