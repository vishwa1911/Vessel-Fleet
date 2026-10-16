import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Ship,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/common/DataTable';
import { Badge, SimulationTag } from '../components/common/Badge';
import { Modal, ConfirmDialog } from '../components/common/Modal';
import { VESSEL_TYPES, VESSEL_STATUSES } from '../utils/constants';
import { formatNumber, formatCoordinates } from '../utils/formatters';

export const Vessels = () => {
  const { isAdmin, hasRole } = useAuth();
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    type: 'Container Ship',
    flag: 'Singapore',
    capacityDwt: 50000,
    status: 'Active',
    lengthM: 200,
    beamM: 32,
    engineType: 'Two-stroke Diesel',
    enginePowerKw: 25000,
    builtYear: 2020,
    lat: 1.29027,
    lng: 103.851959,
  });

  const fetchVessels = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        sortBy,
        order: sortOrder,
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        type: typeFilter !== 'All' ? typeFilter : undefined,
      };

      const res = await api.get('/vessels', { params });
      setVessels(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('[Vessels fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchVessels();
  }, [fetchVessels]);

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
    try {
      await api.post('/vessels', {
        name: formData.name,
        imoNumber: formData.imoNumber,
        type: formData.type,
        flag: formData.flag,
        capacityDwt: Number(formData.capacityDwt),
        status: formData.status,
        specs: {
          lengthM: Number(formData.lengthM),
          beamM: Number(formData.beamM),
          engineType: formData.engineType,
          enginePowerKw: Number(formData.enginePowerKw),
          builtYear: Number(formData.builtYear),
        },
        lastKnownPosition: {
          lat: Number(formData.lat),
          lng: Number(formData.lng),
          speedKnots: 15,
          heading: 0,
          source: 'demo-simulated',
        },
      });

      setCreateModalOpen(false);
      setFormSuccess('Vessel added to fleet successfully.');
      fetchVessels();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create vessel.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.put(`/vessels/${selectedVessel._id}`, {
        status: formData.status,
        flag: formData.flag,
        capacityDwt: Number(formData.capacityDwt),
      });

      setEditModalOpen(false);
      setFormSuccess('Vessel updated successfully.');
      fetchVessels();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update vessel.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVessel) return;
    try {
      await api.delete(`/vessels/${selectedVessel._id}`);
      setFormSuccess(`Vessel ${selectedVessel.name} removed from fleet.`);
      fetchVessels();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vessel.');
    }
  };

  const openEditModal = (vessel) => {
    setSelectedVessel(vessel);
    setFormData({
      ...formData,
      status: vessel.status,
      flag: vessel.flag,
      capacityDwt: vessel.capacityDwt,
    });
    setFormError('');
    setEditModalOpen(true);
  };

  const columns = [
    {
      label: 'Vessel Name & IMO',
      key: 'name',
      sortable: true,
      render: (v) => (
        <div>
          <Link
            to={`/vessels/${v._id}`}
            className="font-bold text-slate-800 hover:text-sky-600 transition"
          >
            {v.name}
          </Link>
          <div className="text-[11px] text-slate-500">
            IMO: {v.imoNumber} &bull; Flag: {v.flag}
          </div>
        </div>
      ),
    },
    {
      label: 'Type',
      key: 'type',
      sortable: true,
      render: (v) => <span className="text-slate-700 font-medium">{v.type}</span>,
    },
    {
      label: 'Capacity (DWT)',
      key: 'capacityDwt',
      sortable: true,
      render: (v) => <span className="text-slate-700 font-medium">{formatNumber(v.capacityDwt)} MT</span>,
    },
    {
      label: 'Status',
      key: 'status',
      sortable: true,
      render: (v) => <Badge status={v.status} size="xs" />,
    },
    {
      label: 'Position (Lat, Lng)',
      key: 'lastKnownPosition',
      render: (v) => (
        <div>
          <div className="text-xs text-slate-700">
            {formatCoordinates(v.lastKnownPosition?.lat, v.lastKnownPosition?.lng)}
          </div>
          <div className="text-[10px] text-sky-600 font-semibold">
            {v.lastKnownPosition?.speedKnots || 0} kn &bull; {v.lastKnownPosition?.source || 'simulated'}
          </div>
        </div>
      ),
    },
    {
      label: 'Engine Hours',
      key: 'engineRunningHours',
      sortable: true,
      render: (v) => <span className="text-slate-700">{formatNumber(v.engineRunningHours)} hrs</span>,
    },
    {
      label: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (v) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/vessels/${v._id}`}
            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-slate-600 hover:text-sky-600 border border-sky-100 transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {hasRole('Admin', 'Fleet Operator') && (
            <button
              onClick={() => openEditModal(v)}
              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-100 transition"
              title="Edit Vessel"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setSelectedVessel(v);
                setDeleteDialogOpen(true);
              }}
              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-100 transition"
              title="Delete Vessel"
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Vessel Registry</h1>
            <SimulationTag />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered commercial vessels, technical specifications, real-time simulated positioning, and status.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setFormData({
                name: '',
                imoNumber: String(Math.floor(1000000 + Math.random() * 9000000)),
                type: 'Container Ship',
                flag: 'Singapore',
                capacityDwt: 65000,
                status: 'Active',
                lengthM: 260,
                beamM: 36,
                engineType: 'MAN B&W Diesel',
                enginePowerKw: 35000,
                builtYear: 2021,
                lat: 1.29027,
                lng: 103.851959,
              });
              setFormError('');
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs rounded-lg transition shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Vessel</span>
          </button>
        )}
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Vessels Data Table */}
      <DataTable
        columns={columns}
        data={vessels}
        loading={loading}
        searchPlaceholder="Search vessel name, IMO number, or flag..."
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
            options: [{ value: 'All', label: 'All Statuses' }, ...VESSEL_STATUSES.map((s) => ({ value: s, label: s }))],
          },
          {
            value: typeFilter,
            onChange: (val) => {
              setTypeFilter(val);
              setPage(1);
            },
            options: [{ value: 'All', label: 'All Ship Types' }, ...VESSEL_TYPES.map((t) => ({ value: t, label: t }))],
          },
        ]}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Create Vessel Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New Fleet Vessel"
        maxWidth="max-w-2xl"
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
              <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
                Vessel Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pacific Mariner"
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
                IMO Number (7 digits) *
              </label>
              <input
                type="text"
                required
                pattern="^\d{7}$"
                value={formData.imoNumber}
                onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                placeholder="e.g. 9425611"
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
                Ship Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {VESSEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
                Flag State
              </label>
              <input
                type="text"
                required
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                placeholder="Singapore"
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
                Capacity (DWT)
              </label>
              <input
                type="number"
                required
                value={formData.capacityDwt}
                onChange={(e) => setFormData({ ...formData, capacityDwt: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 pt-2 border-t border-sky-100">
            <div>
              <label className="block text-slate-600 mb-1">Length (M)</label>
              <input
                type="number"
                value={formData.lengthM}
                onChange={(e) => setFormData({ ...formData, lengthM: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Beam (M)</label>
              <input
                type="number"
                value={formData.beamM}
                onChange={(e) => setFormData({ ...formData, beamM: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Power (kW)</label>
              <input
                type="number"
                value={formData.enginePowerKw}
                onChange={(e) => setFormData({ ...formData, enginePowerKw: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Built Year</label>
              <input
                type="number"
                value={formData.builtYear}
                onChange={(e) => setFormData({ ...formData, builtYear: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-sky-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-semibold shadow-md shadow-sky-500/20"
            >
              Register Vessel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vessel Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Update Vessel: ${selectedVessel?.name}`}
        maxWidth="max-w-md"
      >
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Operational Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              {VESSEL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Flag State
            </label>
            <input
              type="text"
              value={formData.flag}
              onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Capacity DWT
            </label>
            <input
              type="number"
              value={formData.capacityDwt}
              onChange={(e) => setFormData({ ...formData, capacityDwt: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-sky-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-semibold shadow-md shadow-sky-500/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Vessel from Fleet?"
        message={`Are you sure you want to delete ${selectedVessel?.name}? This action cannot be undone if the vessel has no active voyages.`}
        confirmText="Delete Vessel"
        danger={true}
      />
    </div>
  );
};
