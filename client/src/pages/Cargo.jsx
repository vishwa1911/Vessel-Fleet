import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/common/DataTable';
import { Badge, SimulationTag } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { CARGO_STATUSES } from '../utils/constants';
import { formatDate, formatNumber } from '../utils/formatters';

const VALID_TRANSITIONS = {
  Booked: ['Loaded', 'Cancelled'],
  Loaded: ['In Transit', 'Booked'],
  'In Transit': ['Delayed', 'Delivered'],
  Delayed: ['In Transit', 'Delivered'],
  Delivered: [],
};

export const Cargo = () => {
  const { hasRole, isAdmin, isCargoManager } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState({
    shipmentNo: '',
    cargoType: 'Consumer Electronics & Machinery',
    quantity: 450,
    unit: 'TEU',
    weightTons: 6300,
    origin: 'Port of Singapore',
    destination: 'Port of Rotterdam',
    voyage: '',
    status: 'Booked',
    estimatedDelivery: '',
  });

  const [newStatus, setNewStatus] = useState('');

  const fetchCargoData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        page,
        limit: 10,
      };

      const res = await api.get('/cargo', { params });
      setShipments(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('[Cargo fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchCargoData();
    api.get('/voyages?limit=50').then((res) => {
      setVoyages(res.data.data || []);
      if (!formData.voyage && res.data.data?.length > 0) {
        const firstV = res.data.data[0];
        setFormData((prev) => ({
          ...prev,
          voyage: firstV._id,
          origin: firstV.origin.name,
          destination: firstV.destination.name,
          estimatedDelivery: firstV.estimatedArrival?.slice(0, 10) || '',
        }));
      }
    }).catch(console.error);
  }, [fetchCargoData]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/cargo', {
        ...formData,
        quantity: Number(formData.quantity),
        weightTons: Number(formData.weightTons),
      });

      setCreateModalOpen(false);
      setFormSuccess('Cargo shipment registered successfully.');
      fetchCargoData();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create shipment.');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.put(`/cargo/${selectedShipment._id}`, {
        status: newStatus,
      });

      setStatusModalOpen(false);
      setFormSuccess(`Shipment status advanced to ${newStatus}.`);
      fetchCargoData();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to transition status.');
    }
  };

  const openStatusModal = (shipment) => {
    setSelectedShipment(shipment);
    const allowed = VALID_TRANSITIONS[shipment.status] || [];
    setNewStatus(allowed[0] || shipment.status);
    setFormError('');
    setStatusModalOpen(true);
  };

  const columns = [
    {
      label: 'Shipment No',
      key: 'shipmentNo',
      render: (s) => (
        <div>
          <span className="font-bold text-white">{s.shipmentNo}</span>
          <div className="text-[11px] text-slate-400">Created {formatDate(s.createdAt)}</div>
        </div>
      ),
    },
    {
      label: 'Cargo Manifest & Volume',
      key: 'cargoType',
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-200">{s.cargoType}</span>
          <div className="text-[11px] text-slate-400">
            {formatNumber(s.quantity)} {s.unit} &bull; {formatNumber(s.weightTons)} MT
          </div>
        </div>
      ),
    },
    {
      label: 'Route (Origin &rarr; Dest)',
      key: 'origin',
      render: (s) => (
        <div>
          <span className="text-white text-xs">{s.origin}</span>
          <div className="text-[11px] text-ocean-400 font-medium">&rarr; {s.destination}</div>
        </div>
      ),
    },
    {
      label: 'Assigned Voyage',
      key: 'voyage',
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-300">{s.voyage?.voyageNo || 'Unassigned'}</span>
          {s.voyage?.status === 'Delayed' && (
            <span className="block text-[10px] text-rose-400 font-bold">Voyage Delayed (+{s.voyage.delayHours}h)</span>
          )}
        </div>
      ),
    },
    {
      label: 'Estimated Delivery',
      key: 'estimatedDelivery',
      render: (s) => <span>{formatDate(s.estimatedDelivery)}</span>,
    },
    {
      label: 'Status',
      key: 'status',
      render: (s) => <Badge status={s.status} size="xs" />,
    },
    {
      label: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (s) => (
        hasRole('Admin', 'Cargo Manager') && s.status !== 'Delivered' && (
          <button
            onClick={() => openStatusModal(s)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-ocean-400 hover:text-white transition"
          >
            Update Status
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Cargo Logistics & Manifest Tracking</h1>
            <SimulationTag />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Commercial shipment manifest, lifecycle transitions (Booked &rarr; Loaded &rarr; In Transit &rarr; Delivered), and delay notifications.
          </p>
        </div>

        {hasRole('Admin', 'Cargo Manager') && (
          <button
            onClick={() => {
              const now = new Date();
              setFormData({
                shipmentNo: `SHP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                cargoType: 'Consumer Electronics & Machinery',
                quantity: 500,
                unit: 'TEU',
                weightTons: 7000,
                origin: voyages[0]?.origin?.name || 'Port of Singapore',
                destination: voyages[0]?.destination?.name || 'Port of Rotterdam',
                voyage: voyages[0]?._id || '',
                status: 'Booked',
                estimatedDelivery: voyages[0]?.estimatedArrival?.slice(0, 10) || '',
              });
              setFormError('');
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-ocean-600 hover:bg-ocean-500 text-white font-medium text-xs rounded-lg transition shadow-md shadow-ocean-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Shipment</span>
          </button>
        )}
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Cargo Data Table */}
      <DataTable
        columns={columns}
        data={shipments}
        loading={loading}
        searchPlaceholder="Search shipment tracking number or cargo type..."
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
              { value: 'All', label: 'All Lifecycle Statuses' },
              ...CARGO_STATUSES.map((s) => ({ value: s, label: s })),
            ],
          },
        ]}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Register Shipment Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register Commercial Shipment Manifest"
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
                Tracking Shipment No *
              </label>
              <input
                type="text"
                required
                value={formData.shipmentNo}
                onChange={(e) => setFormData({ ...formData, shipmentNo: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Assigned Voyage *
              </label>
              <select
                required
                value={formData.voyage}
                onChange={(e) => {
                  const selV = voyages.find((v) => v._id === e.target.value);
                  setFormData({
                    ...formData,
                    voyage: e.target.value,
                    origin: selV ? selV.origin.name : formData.origin,
                    destination: selV ? selV.destination.name : formData.destination,
                    estimatedDelivery: selV ? selV.estimatedArrival?.slice(0, 10) : formData.estimatedDelivery,
                  });
                }}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              >
                {voyages.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.voyageNo} ({v.origin?.name} &rarr; {v.destination?.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
              Cargo Description / Manifest *
            </label>
            <input
              type="text"
              required
              value={formData.cargoType}
              onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
              placeholder="e.g. Pharmaceutical Supplies"
              className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Quantity *
              </label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Unit of Measure
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="TEU">TEU (Containers)</option>
                <option value="Metric Tons">Metric Tons</option>
                <option value="Barrels">Barrels (Crude)</option>
                <option value="CBM">CBM (Gas Volume)</option>
                <option value="Units">Units (Vehicles)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Weight (Tons) *
              </label>
              <input
                type="number"
                required
                value={formData.weightTons}
                onChange={(e) => setFormData({ ...formData, weightTons: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Origin Port
              </label>
              <input
                type="text"
                required
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Destination Port
              </label>
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
              Estimated Delivery Date *
            </label>
            <input
              type="date"
              required
              value={formData.estimatedDelivery}
              onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
              className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
            />
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
              Register Manifest
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Shipment Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Progress Shipment: ${selectedShipment?.shipmentNo}`}
        maxWidth="max-w-md"
      >
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
          <div>
            <p className="text-slate-400 mb-1">Current Lifecycle Status:</p>
            <Badge status={selectedShipment?.status} size="md" />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
              Transition to Next Valid Status:
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
            >
              {(VALID_TRANSITIONS[selectedShipment?.status] || []).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-500 font-semibold"
            >
              Update Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
