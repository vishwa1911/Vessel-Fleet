import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  Trash2,
  Calendar,
  Clock,
  Info,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/common/DataTable';
import { Badge, SimulationTag } from '../components/common/Badge';
import { Modal, ConfirmDialog } from '../components/common/Modal';
import { VOYAGE_STATUSES } from '../utils/constants';
import { formatDate, formatNumber } from '../utils/formatters';

const DEFAULT_PORTS = [
  { name: 'Port of Singapore', lat: 1.29027, lng: 103.851959 },
  { name: 'Port of Rotterdam', lat: 51.9244, lng: 4.4777 },
  { name: 'Chennai Port', lat: 13.0827, lng: 80.2707 },
  { name: 'Port of Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Jebel Ali Port (Dubai)', lat: 25.0084, lng: 55.0617 },
  { name: 'Port of Antwerp', lat: 51.2194, lng: 4.4025 },
  { name: 'Port of Shanghai', lat: 31.2304, lng: 121.4737 },
  { name: 'Jawaharlal Nehru Port (Mumbai)', lat: 18.9499, lng: 72.9515 },
  { name: 'Port of Hong Kong', lat: 22.3193, lng: 114.1694 },
];

export const Voyages = () => {
  const { hasRole, isAdmin } = useAuth();
  const [voyages, setVoyages] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [sortBy, setSortBy] = useState('departureDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVoyage, setSelectedVoyage] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    voyageNo: '',
    vessel: '',
    originName: 'Port of Singapore',
    destName: 'Port of Rotterdam',
    departureDate: '',
    estimatedArrival: '',
    status: 'Planned',
  });

  const fetchVoyages = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        sortBy,
        order: sortOrder,
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      };

      const res = await api.get('/voyages', { params });
      setVoyages(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('[Voyages fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search, statusFilter]);

  useEffect(() => {
    fetchVoyages();
    // Also load vessels for selection
    api.get('/vessels?limit=100').then((res) => {
      setVessels(res.data.data || []);
    }).catch(console.error);
  }, [fetchVoyages]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const originPort = DEFAULT_PORTS.find((p) => p.name === formData.originName) || DEFAULT_PORTS[0];
    const destPort = DEFAULT_PORTS.find((p) => p.name === formData.destName) || DEFAULT_PORTS[1];

    try {
      await api.post('/voyages', {
        voyageNo: formData.voyageNo,
        vessel: formData.vessel,
        origin: originPort,
        destination: destPort,
        departureDate: formData.departureDate,
        estimatedArrival: formData.estimatedArrival,
        status: formData.status,
      });

      setCreateModalOpen(false);
      setFormSuccess('Voyage scheduled successfully.');
      fetchVoyages();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create voyage.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVoyage) return;
    try {
      await api.delete(`/voyages/${selectedVoyage._id}`);
      setFormSuccess(`Voyage ${selectedVoyage.voyageNo} deleted.`);
      fetchVoyages();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete voyage.');
    }
  };

  const columns = [
    {
      label: 'Voyage No',
      key: 'voyageNo',
      sortable: true,
      render: (v) => (
        <div>
          <Link
            to={`/voyages/${v._id}`}
            className="font-bold text-white hover:text-ocean-400 transition"
          >
            {v.voyageNo}
          </Link>
          <div className="text-[11px] text-slate-400">
            Progress: {v.progressPercent || 0}%
          </div>
        </div>
      ),
    },
    {
      label: 'Assigned Vessel',
      key: 'vessel',
      render: (v) => (
        <div>
          <span className="font-semibold text-slate-200">{v.vessel?.name || 'Unassigned'}</span>
          <div className="text-[11px] text-slate-400">{v.vessel?.type}</div>
        </div>
      ),
    },
    {
      label: 'Route Corridor',
      key: 'route',
      render: (v) => (
        <div>
          <div className="text-xs text-white font-medium">
            {v.origin?.name} &rarr; <span className="text-ocean-400">{v.destination?.name}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {formatNumber(v.plannedDistanceNm)} NM planned
          </div>
        </div>
      ),
    },
    {
      label: 'Schedule Dates',
      key: 'departureDate',
      sortable: true,
      render: (v) => (
        <div>
          <div className="text-slate-300">Dep: {formatDate(v.departureDate)}</div>
          <div className="text-slate-400 text-[11px]">ETA: {formatDate(v.estimatedArrival)}</div>
        </div>
      ),
    },
    {
      label: 'Status',
      key: 'status',
      sortable: true,
      render: (v) => (
        <div>
          <Badge status={v.status} size="xs" />
          {v.delayHours > 0 && (
            <span className="block text-[10px] text-rose-400 mt-0.5 font-medium">
              +{v.delayHours}h delay
            </span>
          )}
        </div>
      ),
    },
    {
      label: 'Planned Fuel',
      key: 'plannedFuelTons',
      render: (v) => <span>{formatNumber(v.plannedFuelTons)} MT</span>,
    },
    {
      label: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (v) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/voyages/${v._id}`}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-ocean-400 hover:text-white transition"
            title="View Route & Variance"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {hasRole('Admin', 'Fleet Operator') && v.status !== 'In Progress' && (
            <button
              onClick={() => {
                setSelectedVoyage(v);
                setDeleteDialogOpen(true);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
              title="Delete Voyage"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Voyage Operations & Routing</h1>
            <SimulationTag />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Voyage scheduling with vessel conflict prevention, Haversine distance, progress tracking, and delay alerts.
          </p>
        </div>

        {hasRole('Admin', 'Fleet Operator') && (
          <button
            onClick={() => {
              const now = new Date();
              const dep = new Date(now.getTime() + 5 * 24 * 3600 * 1000);
              const arr = new Date(now.getTime() + 18 * 24 * 3600 * 1000);
              setFormData({
                voyageNo: `VOY-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                vessel: vessels[0]?._id || '',
                originName: DEFAULT_PORTS[0].name,
                destName: DEFAULT_PORTS[1].name,
                departureDate: dep.toISOString().slice(0, 16),
                estimatedArrival: arr.toISOString().slice(0, 16),
                status: 'Planned',
              });
              setFormError('');
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-500 text-white font-medium text-xs rounded-lg transition shadow-md shadow-ocean-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Voyage</span>
          </button>
        )}
      </div>

      {/* Info Callout */}
      <div className="p-3.5 rounded-xl bg-maritime-900/80 border border-slate-800 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-ocean-400 flex-shrink-0 mt-0.5" />
        <div className="text-slate-300">
          <span className="font-semibold text-white">Demonstration Haversine Calculations:</span> Route distances and transit ETAs are computed along spherical great-circle waypoint coordinates. The scheduling engine automatically verifies vessel availability to prevent double-booking conflicts.
        </div>
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Voyages Data Table */}
      <DataTable
        columns={columns}
        data={voyages}
        loading={loading}
        searchPlaceholder="Search voyage number or port..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filters={[
          {
            value: statusFilter,
            onChange: (val) => {
              setStatusFilter(val);
              setPage(1);
            },
            options: [
              { value: 'All', label: 'All Statuses' },
              ...VOYAGE_STATUSES.map((s) => ({ value: s, label: s })),
            ],
          },
        ]}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Create Voyage Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule Commercial Voyage"
        maxWidth="max-w-xl"
      >
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Voyage Number *
              </label>
              <input
                type="text"
                required
                value={formData.voyageNo}
                onChange={(e) => setFormData({ ...formData, voyageNo: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Assign Vessel *
              </label>
              <select
                required
                value={formData.vessel}
                onChange={(e) => setFormData({ ...formData, vessel: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="">Select Vessel...</option>
                {vessels.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({v.type} - {v.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Origin Port
              </label>
              <select
                value={formData.originName}
                onChange={(e) => setFormData({ ...formData, originName: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              >
                {DEFAULT_PORTS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Destination Port
              </label>
              <select
                value={formData.destName}
                onChange={(e) => setFormData({ ...formData, destName: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              >
                {DEFAULT_PORTS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Departure Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.departureDate}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Estimated Arrival (ETA) *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.estimatedArrival}
                onChange={(e) => setFormData({ ...formData, estimatedArrival: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
              Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress (Active Steaming)</option>
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
              Schedule Voyage
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Cancel or Delete Voyage?"
        message={`Are you sure you want to remove Voyage ${selectedVoyage?.voyageNo}?`}
        confirmText="Delete Voyage"
        danger={true}
      />
    </div>
  );
};
