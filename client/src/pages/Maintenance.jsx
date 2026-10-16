import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Info,
  Calendar,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/common/DataTable';
import { Badge, SimulationTag } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  MAINTENANCE_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
} from '../utils/constants';
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters';

export const Maintenance = () => {
  const { hasRole, isAdmin, isEngineer } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [riskMatrix, setRiskMatrix] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('tasks'); // 'tasks' or 'riskMatrix'

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState({
    vessel: '',
    equipment: '',
    taskType: 'Inspection',
    priority: 'Medium',
    scheduledDate: '',
    runningHoursThreshold: 5000,
    estimatedCost: 15000,
    notes: '',
  });

  const fetchMaintenanceData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        page,
        limit: 10,
      };

      const [tasksRes, matrixRes] = await Promise.all([
        api.get('/maintenance', { params }),
        api.get('/maintenance/risk-matrix'),
      ]);

      setTasks(tasksRes.data.data);
      setPagination(tasksRes.data.pagination);
      setRiskMatrix(matrixRes.data.data);
    } catch (err) {
      console.error('[Maintenance fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => {
    fetchMaintenanceData();
    api.get('/vessels?limit=100').then((res) => {
      setVessels(res.data.data || []);
      if (!formData.vessel && res.data.data?.length > 0) {
        setFormData((prev) => ({ ...prev, vessel: res.data.data[0]._id }));
      }
    }).catch(console.error);
  }, [fetchMaintenanceData]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/maintenance', {
        ...formData,
        runningHoursThreshold: Number(formData.runningHoursThreshold),
        estimatedCost: Number(formData.estimatedCost),
      });

      setScheduleModalOpen(false);
      setFormSuccess('Maintenance work order scheduled successfully.');
      fetchMaintenanceData();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to schedule task.');
    }
  };

  const handleCompleteTask = async (id) => {
    try {
      await api.put(`/maintenance/${id}`, {
        status: 'Completed',
        completedDate: new Date(),
      });
      setFormSuccess('Maintenance task marked as completed.');
      fetchMaintenanceData();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete task.');
    }
  };

  const columns = [
    {
      label: 'Equipment & Work Order',
      key: 'equipment',
      render: (t) => (
        <div>
          <span className="font-bold text-white">{t.equipment}</span>
          <div className="text-[11px] text-slate-400">
            {t.taskType} &bull; Threshold: {formatNumber(t.runningHoursThreshold)} hrs
          </div>
        </div>
      ),
    },
    {
      label: 'Vessel',
      key: 'vessel',
      render: (t) => (
        <div>
          <Link
            to={`/vessels/${t.vessel?._id}`}
            className="font-semibold text-ocean-400 hover:underline"
          >
            {t.vessel?.name || 'Vessel'}
          </Link>
          <div className="text-[11px] text-slate-400">
            Current: {formatNumber(t.vessel?.engineRunningHours)} hrs
          </div>
        </div>
      ),
    },
    {
      label: 'Priority',
      key: 'priority',
      render: (t) => <Badge status={t.priority} size="xs" />,
    },
    {
      label: 'Scheduled Date',
      key: 'scheduledDate',
      render: (t) => (
        <div>
          <span className="text-slate-200">{formatDate(t.scheduledDate)}</span>
          {t.status === 'Overdue' && (
            <span className="block text-[10px] text-rose-400 font-bold">Past Due Date</span>
          )}
        </div>
      ),
    },
    {
      label: 'Est. Cost',
      key: 'estimatedCost',
      render: (t) => <span className="font-semibold text-slate-200">{formatCurrency(t.estimatedCost)}</span>,
    },
    {
      label: 'Status',
      key: 'status',
      render: (t) => <Badge status={t.status} size="xs" />,
    },
    {
      label: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (t) => (
        hasRole('Admin', 'Marine Engineer') && t.status !== 'Completed' && (
          <button
            onClick={() => handleCompleteTask(t._id)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
          >
            Mark Done
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance & Equipment Risk</h1>
            <SimulationTag />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Preventative maintenance scheduling, running hours tracking, and transparent rule-based risk matrix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-sky-200 rounded-xl p-1 text-xs shadow-sm">
            <button
              onClick={() => setActiveView('tasks')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'tasks'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-sky-600'
              }`}
            >
              Work Orders List
            </button>
            <button
              onClick={() => setActiveView('riskMatrix')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'riskMatrix'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-sky-600'
              }`}
            >
              Fleet Risk Matrix (0-100)
            </button>
          </div>

          {hasRole('Admin', 'Marine Engineer') && (
            <button
              onClick={() => {
                const now = new Date();
                const due = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
                setFormData({
                  vessel: vessels[0]?._id || '',
                  equipment: 'Main Engine Fuel Injectors',
                  taskType: 'Inspection',
                  priority: 'Medium',
                  scheduledDate: due.toISOString().slice(0, 10),
                  runningHoursThreshold: 8000,
                  estimatedCost: 8500,
                  notes: '',
                });
                setFormError('');
                setScheduleModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-sky-500/20"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">Schedule Maintenance</span>
            </button>
          )}
        </div>
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* View 1: Tasks Table */}
      {activeView === 'tasks' && (
        <DataTable
          columns={columns}
          data={tasks}
          loading={loading}
          searchPlaceholder="Search equipment name or component..."
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
                ...MAINTENANCE_STATUSES.map((s) => ({ value: s, label: s })),
              ],
            },
            {
              value: priorityFilter,
              onChange: (val) => {
                setPriorityFilter(val);
                setPage(1);
              },
              options: [
                { value: 'All', label: 'All Priorities' },
                ...MAINTENANCE_PRIORITIES.map((p) => ({ value: p, label: p })),
              ],
            },
          ]}
          pagination={pagination}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* View 2: Transparent Rule-based Fleet Risk Matrix */}
      {activeView === 'riskMatrix' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-maritime-900/80 border border-slate-800 flex items-start gap-3 text-xs">
            <Info className="w-5 h-5 text-ocean-400 flex-shrink-0 mt-0.5" />
            <div className="text-slate-300">
              <span className="font-bold text-white">Rule-based Deterministic Risk Engine (Non-ML):</span> Risk scores (0-100) are computed mathematically based on overdue tasks, high/critical priority open work orders, accumulated running hours vs equipment thresholds, and days elapsed since last logged inspection.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riskMatrix.map((r) => (
              <div
                key={r.vesselId}
                className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <div>
                      <h3 className="font-bold text-white text-base">{r.vesselName}</h3>
                      <p className="text-xs text-slate-400">{r.vesselType}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">{r.score}/100</span>
                      <span
                        className={`block text-[10px] font-bold uppercase ${
                          r.score >= 70
                            ? 'text-rose-400'
                            : r.score >= 40
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {r.category} Risk
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full ${
                        r.score >= 70
                          ? 'bg-rose-500'
                          : r.score >= 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${r.score}%` }}
                    />
                  </div>

                  {/* Explanation */}
                  <div className="p-2.5 rounded-lg bg-maritime-950/70 border border-slate-800/80 text-xs text-slate-300">
                    <span className="font-semibold text-white">Assessment: </span>
                    {r.whyExplanation}
                  </div>

                  {/* Breakdown Factors */}
                  {r.factors?.length > 0 && (
                    <div className="mt-3 space-y-1.5 text-xs">
                      {r.factors.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] text-slate-400"
                        >
                          <span className="truncate pr-2">{f.rule}</span>
                          <span className="font-bold text-rose-300">+{f.weight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <Link
                    to={`/vessels/${r.vesselId}`}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-ocean-400 font-semibold text-xs rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <span>Inspect Vessel Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Maintenance Task"
        maxWidth="max-w-md"
      >
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
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

          <div>
            <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
              Equipment / Component *
            </label>
            <input
              type="text"
              required
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              placeholder="e.g. Turbocharger Rotor"
              className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Task Type
              </label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              >
                {MAINTENANCE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Scheduled Date *
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
                Est. Cost ($)
              </label>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold uppercase tracking-wider">
              Running Hours Service Limit
            </label>
            <input
              type="number"
              value={formData.runningHoursThreshold}
              onChange={(e) => setFormData({ ...formData, runningHoursThreshold: e.target.value })}
              className="w-full px-3 py-2 bg-maritime-900 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-500 font-semibold"
            >
              Schedule Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
