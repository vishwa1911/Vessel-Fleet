import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Ship,
  ArrowLeft,
  Compass,
  Fuel,
  Wrench,
  Package,
  MapPin,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Gauge,
} from 'lucide-react';
import api from '../services/api';
import { Badge, SimulationTag } from '../components/common/Badge';
import { RouteMap } from '../components/map/RouteMap';
import { formatNumber, formatCurrency, formatDate, formatDateTime, formatCoordinates } from '../utils/formatters';

export const VesselDetail = () => {
  const { id } = useParams();
  const [vessel, setVessel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchVessel = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vessels/${id}`);
      setVessel(res.data.data);
    } catch (err) {
      console.error('[VesselDetail fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVessel();
  }, [fetchVessel]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-40 bg-slate-800 rounded-xl" />
        <div className="h-96 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!vessel) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400 rounded-xl">
        <p>Vessel record not found.</p>
        <Link to="/vessels" className="mt-3 inline-block text-ocean-400 hover:underline text-xs">
          &larr; Back to Vessels Registry
        </Link>
      </div>
    );
  }

  const pos = vessel.lastKnownPosition;
  const risk = vessel.riskScore;

  const tabs = [
    { id: 'overview', label: 'Specs & Overview', icon: Ship },
    { id: 'position', label: 'Telemetry & Map', icon: MapPin },
    { id: 'voyages', label: `Voyage History (${vessel.voyages?.length || 0})`, icon: Compass },
    { id: 'fuel', label: `Fuel Logs (${vessel.fuelRecords?.length || 0})`, icon: Fuel },
    { id: 'maintenance', label: `Maintenance & Risk (${vessel.maintenanceTasks?.length || 0})`, icon: Wrench },
    { id: 'cargo', label: `Cargo Manifest (${vessel.cargoShipments?.length || 0})`, icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/vessels"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-400 hover:text-ocean-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vessels Registry</span>
        </Link>
      </div>

      {/* Vessel Header Profile Card */}
      <div className="glass-panel p-6 rounded-2xl border border-sky-100 bg-white shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm">
            <Ship className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{vessel.name}</h1>
              <Badge status={vessel.status} size="md" />
              <SimulationTag />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              IMO: <span className="text-slate-800 font-semibold">{vessel.imoNumber}</span> &bull; Flag: <span className="text-slate-700">{vessel.flag}</span> &bull; Type: <span className="text-slate-700">{vessel.type}</span> &bull; DWT: <span className="text-slate-700">{formatNumber(vessel.capacityDwt)} MT</span>
            </p>
          </div>
        </div>

        {/* Live Status Chip */}
        <div className="flex items-center gap-4">
          {risk && (
            <div className="text-right border-r border-sky-100 pr-4">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Rule-based Risk Score
              </p>
              <div className="flex items-center gap-2 justify-end mt-0.5">
                <span className="text-xl font-black text-slate-900">{risk.score}/100</span>
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                    risk.score >= 70
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : risk.score >= 40
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {risk.category} Risk
                </span>
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Current Speed & Heading
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {pos?.speedKnots || 0} kn <span className="text-xs font-normal text-slate-500">@ {pos?.heading || 0}°</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-sky-100 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-sky-500 text-sky-600 bg-sky-50/80 font-bold'
                  : 'border-transparent text-slate-500 hover:text-sky-600 hover:border-sky-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Specs */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Hull & Dimension Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Length Overall (LOA):</span>
                <p className="text-white font-semibold mt-0.5">{vessel.specs?.lengthM || 0} meters</p>
              </div>
              <div>
                <span className="text-slate-400">Beam (Width):</span>
                <p className="text-white font-semibold mt-0.5">{vessel.specs?.beamM || 0} meters</p>
              </div>
              <div>
                <span className="text-slate-400">Year Built:</span>
                <p className="text-white font-semibold mt-0.5">{vessel.specs?.builtYear || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400">Deadweight Tonnage:</span>
                <p className="text-white font-semibold mt-0.5">{formatNumber(vessel.capacityDwt)} MT</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Propulsion & Machinery
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <span className="text-slate-400">Main Engine Model:</span>
                <p className="text-white font-semibold mt-0.5">{vessel.specs?.engineType || 'Marine Diesel'}</p>
              </div>
              <div>
                <span className="text-slate-400">Engine Rated Power:</span>
                <p className="text-white font-semibold mt-0.5">{formatNumber(vessel.specs?.enginePowerKw)} kW</p>
              </div>
              <div>
                <span className="text-slate-400">Accumulated Engine Hours:</span>
                <p className="text-white font-semibold mt-0.5">{formatNumber(vessel.engineRunningHours)} hours</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Position & Telemetry */}
      {activeTab === 'position' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-ocean-400" />
              <div>
                <p className="font-semibold text-white">
                  Last Known Coordinates: {formatCoordinates(pos?.lat, pos?.lng)}
                </p>
                <p className="text-slate-400 text-[11px]">
                  Logged at {formatDateTime(pos?.updatedAt)} &bull; Speed: {pos?.speedKnots || 0} kn &bull; Heading: {pos?.heading || 0}°
                </p>
              </div>
            </div>
            <SimulationTag label="Simulated Position Stream" />
          </div>

          {vessel.activeVoyage ? (
            <RouteMap
              origin={vessel.activeVoyage.origin}
              destination={vessel.activeVoyage.destination}
              waypoints={vessel.activeVoyage.waypoints || []}
              currentPosition={pos}
              vesselName={vessel.name}
              height="450px"
            />
          ) : (
            <div className="glass-panel p-8 text-center text-slate-400 rounded-xl text-xs">
              Vessel is currently {vessel.status}. Position logged at anchor/berth.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Voyages */}
      {activeTab === 'voyages' && (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-maritime-900 border-b border-slate-800 uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="p-3">Voyage No</th>
                <th className="p-3">Origin &rarr; Destination</th>
                <th className="p-3">Departure</th>
                <th className="p-3">Estimated Arrival</th>
                <th className="p-3">Planned Distance</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(vessel.voyages || []).map((vy) => (
                <tr key={vy._id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{vy.voyageNo}</td>
                  <td className="p-3 text-slate-200">{vy.origin?.name} &rarr; {vy.destination?.name}</td>
                  <td className="p-3 text-slate-300">{formatDate(vy.departureDate)}</td>
                  <td className="p-3 text-slate-300">{formatDate(vy.estimatedArrival)}</td>
                  <td className="p-3 text-slate-300">{formatNumber(vy.plannedDistanceNm)} NM</td>
                  <td className="p-3"><Badge status={vy.status} size="xs" /></td>
                  <td className="p-3 text-right">
                    <Link to={`/voyages/${vy._id}`} className="text-ocean-400 hover:underline">
                      View Route &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Fuel Logs */}
      {activeTab === 'fuel' && (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-maritime-900 border-b border-slate-800 uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Fuel Type</th>
                <th className="p-3">Quantity (MT)</th>
                <th className="p-3">Price / MT</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3">Tons / NM</th>
                <th className="p-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(vessel.fuelRecords || []).map((fr) => (
                <tr key={fr._id} className="hover:bg-slate-800/40">
                  <td className="p-3 text-slate-300">{formatDate(fr.date)}</td>
                  <td className="p-3 font-semibold text-white">{fr.fuelType}</td>
                  <td className="p-3 text-slate-200">{formatNumber(fr.quantityTons)} MT</td>
                  <td className="p-3 text-slate-300">{formatCurrency(fr.pricePerTon)}</td>
                  <td className="p-3 font-semibold text-emerald-400">{formatCurrency(fr.totalCost)}</td>
                  <td className="p-3 text-slate-300">{fr.tonsPerNm || '—'}</td>
                  <td className="p-3"><Badge status={fr.source} size="xs" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Maintenance & Risk Score */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {risk && (
            <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-ocean-400" />
                  <h3 className="font-bold text-white text-base">Rule-based Maintenance Risk Assessment</h3>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Non-ML Deterministic Algorithm
                </span>
              </div>

              {/* Score Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Risk Score Metric</span>
                  <span className="font-bold text-white">{risk.score} / 100 ({risk.category} Risk)</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      risk.score >= 70
                        ? 'bg-rose-500'
                        : risk.score >= 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${risk.score}%` }}
                  />
                </div>
              </div>

              {/* Explanatory Callout */}
              <div className="p-3 rounded-lg bg-maritime-950/80 border border-slate-800 flex items-start gap-2.5 text-xs">
                <Info className="w-4 h-4 text-ocean-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Why this vessel needs inspection:</p>
                  <p className="text-slate-300 mt-0.5">{risk.whyExplanation}</p>
                </div>
              </div>

              {/* Contributing Factors */}
              {risk.factors?.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Contributing Risk Factors Breakdown:
                  </p>
                  <div className="space-y-1.5">
                    {risk.factors.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{f.rule}</span>
                          <p className="text-slate-400 text-[11px]">{f.detail}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[11px]">
                          +{f.weight} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Tasks List */}
          <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                Scheduled & Historical Maintenance Tasks
              </h4>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-maritime-900 border-b border-slate-800 uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Task Type</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Scheduled</th>
                  <th className="p-3">Threshold</th>
                  <th className="p-3">Est. Cost</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(vessel.maintenanceTasks || []).map((m) => (
                  <tr key={m._id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{m.equipment}</td>
                    <td className="p-3 text-slate-300">{m.taskType}</td>
                    <td className="p-3"><Badge status={m.priority} size="xs" /></td>
                    <td className="p-3 text-slate-300">{formatDate(m.scheduledDate)}</td>
                    <td className="p-3 text-slate-400">{formatNumber(m.runningHoursThreshold)} hrs</td>
                    <td className="p-3 font-semibold text-slate-200">{formatCurrency(m.estimatedCost)}</td>
                    <td className="p-3"><Badge status={m.status} size="xs" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Manifest Cargo Shipments */}
      {activeTab === 'cargo' && (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-maritime-900 border-b border-slate-800 uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="p-3">Shipment No</th>
                <th className="p-3">Cargo Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Weight (MT)</th>
                <th className="p-3">Route</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(vessel.cargoShipments || []).map((cg) => (
                <tr key={cg._id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{cg.shipmentNo}</td>
                  <td className="p-3 text-slate-300">{cg.cargoType}</td>
                  <td className="p-3 text-slate-200">{formatNumber(cg.quantity)} {cg.unit}</td>
                  <td className="p-3 text-slate-200">{formatNumber(cg.weightTons)} MT</td>
                  <td className="p-3 text-slate-400">{cg.origin} &rarr; {cg.destination}</td>
                  <td className="p-3"><Badge status={cg.status} size="xs" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
