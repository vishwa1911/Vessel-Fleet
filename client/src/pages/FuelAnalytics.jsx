import React, { useState, useEffect, useCallback } from 'react';
import {
  Fuel,
  Plus,
  TrendingDown,
  DollarSign,
  Gauge,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Trash2,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/common/MetricCard';
import { DataTable } from '../components/common/DataTable';
import { Badge, SimulationTag } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { FuelTrendChart } from '../components/charts/DashboardCharts';
import { FUEL_TYPES } from '../utils/constants';
import { formatNumber, formatCurrency, formatDate } from '../utils/formatters';

export const FuelAnalytics = () => {
  const { hasRole, isAdmin, isEngineer } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [records, setRecords] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [vesselFilter, setVesselFilter] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState({
    vessel: '',
    fuelType: 'VLSFO',
    quantityTons: 40,
    pricePerTon: 650,
    distanceNm: 1100,
    source: 'measured',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        vessel: vesselFilter || undefined,
        fuelType: fuelTypeFilter !== 'All' ? fuelTypeFilter : undefined,
        source: sourceFilter !== 'All' ? sourceFilter : undefined,
        page,
        limit: 10,
      };

      const [analyticsRes, recordsRes] = await Promise.all([
        api.get('/fuel/analytics', { params: { vessel: vesselFilter || undefined } }),
        api.get('/fuel', { params }),
      ]);

      setAnalytics(analyticsRes.data.data);
      setRecords(recordsRes.data.data);
      setPagination(recordsRes.data.pagination);
    } catch (err) {
      console.error('[Fuel fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [vesselFilter, fuelTypeFilter, sourceFilter, page]);

  useEffect(() => {
    fetchData();
    api.get('/vessels?limit=100').then((res) => {
      setVessels(res.data.data || []);
      if (!formData.vessel && res.data.data?.length > 0) {
        setFormData((prev) => ({ ...prev, vessel: res.data.data[0]._id }));
      }
    }).catch(console.error);
  }, [fetchData]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/fuel', {
        ...formData,
        quantityTons: Number(formData.quantityTons),
        pricePerTon: Number(formData.pricePerTon),
        distanceNm: Number(formData.distanceNm),
      });

      setCreateModalOpen(false);
      setFormSuccess('Fuel consumption record added successfully.');
      fetchData();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record fuel consumption.');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fuel record?')) return;
    try {
      await api.delete(`/fuel/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record.');
    }
  };

  const summary = analytics?.summary;

  const columns = [
    {
      label: 'Date',
      key: 'date',
      sortable: true,
      render: (r) => <span>{formatDate(r.date)}</span>,
    },
    {
      label: 'Vessel Name',
      key: 'vessel',
      render: (r) => (
        <div>
          <span className="font-semibold text-white">{r.vessel?.name || 'Vessel'}</span>
          <div className="text-[11px] text-slate-400">{r.vessel?.type}</div>
        </div>
      ),
    },
    {
      label: 'Fuel Grade',
      key: 'fuelType',
      render: (r) => <span className="font-bold text-slate-200">{r.fuelType}</span>,
    },
    {
      label: 'Quantity',
      key: 'quantityTons',
      render: (r) => <span className="font-semibold text-white">{formatNumber(r.quantityTons)} MT</span>,
    },
    {
      label: 'Tons / NM',
      key: 'tonsPerNm',
      render: (r) => (
        <div>
          <span className="text-slate-200">{r.tonsPerNm || '0.035'} MT/NM</span>
          <div className="text-[10px] text-slate-400">{formatNumber(r.distanceNm)} NM steamed</div>
        </div>
      ),
    },
    {
      label: 'Total Cost',
      key: 'totalCost',
      render: (r) => (
        <div>
          <span className="font-bold text-emerald-400">{formatCurrency(r.totalCost)}</span>
          <div className="text-[10px] text-slate-400">@{formatCurrency(r.pricePerTon)}/MT</div>
        </div>
      ),
    },
    {
      label: 'Source',
      key: 'source',
      render: (r) => <Badge status={r.source} size="xs" />,
    },
    {
      label: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (r) => (
        hasRole('Admin', 'Marine Engineer') && (
          <button
            onClick={() => handleDeleteRecord(r._id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Fuel Analytics & Bunker Optimization</h1>
            <SimulationTag />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bunker fuel monitoring, efficiency baseline variance, tons/NM metrics, and rule-based speed recommendations.
          </p>
        </div>

        {hasRole('Admin', 'Marine Engineer') && (
          <button
            onClick={() => {
              setFormError('');
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-500 text-white font-medium text-xs rounded-lg transition shadow-md shadow-ocean-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Record Bunker Consumption</span>
          </button>
        )}
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Bunker Bunkered"
          value={summary ? `${formatNumber(summary.totalQuantityTons)} MT` : '—'}
          subtitle={`${summary?.recordCount || 0} logged events`}
          icon={Fuel}
          color="ocean"
        />
        <MetricCard
          title="Total Bunkering Cost"
          value={summary ? formatCurrency(summary.totalCost) : '—'}
          subtitle={`Avg Price: ${formatCurrency(summary?.avgPricePerTon || 650)}/MT`}
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Steaming Distance"
          value={summary ? `${formatNumber(summary.totalDistanceNm)} NM` : '—'}
          subtitle="Cumulative tracked transit"
          icon={Gauge}
          color="teal"
        />
        <MetricCard
          title="Average Efficiency"
          value={summary ? `${summary.avgTonsPerNm} MT/NM` : '—'}
          subtitle="Baseline: ~0.032 MT/NM"
          icon={TrendingDown}
          color="purple"
        />
      </div>

      {/* Chart & Rule-based Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FuelTrendChart data={analytics?.trend || []} />
        </div>

        {/* Rule-based Optimization Engine Suggestions */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Rule-based Efficiency Suggestions</h3>
                <p className="text-[10px] text-slate-400">Deterministic speed/hull optimization rules</p>
              </div>
            </div>

            <div className="space-y-3">
              {(analytics?.recommendations || []).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-maritime-950/70 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{rec.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                      {rec.impact} Impact
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{rec.suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            Non-ML operational rules based on hydrodynamic drag baselines and standard vessel consumption profiles.
          </div>
        </div>
      </div>

      {/* Fuel Consumption Records Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        filters={[
          {
            value: vesselFilter,
            onChange: (val) => {
              setVesselFilter(val);
              setPage(1);
            },
            options: [
              { value: '', label: 'All Fleet Vessels' },
              ...vessels.map((v) => ({ value: v._id, label: v.name })),
            ],
          },
          {
            value: fuelTypeFilter,
            onChange: (val) => {
              setFuelTypeFilter(val);
              setPage(1);
            },
            options: [
              { value: 'All', label: 'All Fuel Types' },
              ...FUEL_TYPES.map((f) => ({ value: f, label: f })),
            ],
          },
          {
            value: sourceFilter,
            onChange: (val) => {
              setSourceFilter(val);
              setPage(1);
            },
            options: [
              { value: 'All', label: 'All Sources' },
              { value: 'measured', label: 'Measured' },
              { value: 'estimated', label: 'Estimated' },
              { value: 'simulated', label: 'Simulated' },
            ],
          },
        ]}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Record Fuel Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Record Bunker Fuel Consumption"
        maxWidth="max-w-md"
      >
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
              Vessel *
            </label>
            <select
              required
              value={formData.vessel}
              onChange={(e) => setFormData({ ...formData, vessel: e.target.value })}
              className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
            >
              {vessels.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name} ({v.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Fuel Grade
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Quantity (Tons) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.quantityTons}
                onChange={(e) => setFormData({ ...formData, quantityTons: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Price / Ton ($)
              </label>
              <input
                type="number"
                required
                value={formData.pricePerTon}
                onChange={(e) => setFormData({ ...formData, pricePerTon: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Distance Steamed (NM)
              </label>
              <input
                type="number"
                value={formData.distanceNm}
                onChange={(e) => setFormData({ ...formData, distanceNm: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
              Data Measurement Source
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
            >
              <option value="measured">Measured (Flowmeter / Sounding)</option>
              <option value="estimated">Estimated (Voyage baseline)</option>
              <option value="simulated">Simulated</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-500 font-semibold"
            >
              Log Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
