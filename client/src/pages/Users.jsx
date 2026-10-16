import React, { useState, useEffect, useCallback } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Edit2,
  Trash2,
  Shield,
  CheckCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { Modal, ConfirmDialog } from '../components/common/Modal';
import { ROLES } from '../utils/constants';
import { formatDate } from '../utils/formatters';

const ROLE_OPTIONS = ['Admin', 'Fleet Operator', 'Marine Engineer', 'Cargo Manager'];

export const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Fleet Operator',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    role: '',
    isActive: true,
    newPassword: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        role: roleFilter !== 'All' ? roleFilter : undefined,
        page,
        limit: 10,
      };

      const res = await api.get('/users', { params });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('[Users fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/users', createFormData);
      setCreateModalOpen(false);
      setFormSuccess('User account registered successfully.');
      fetchUsers();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user account.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        name: editFormData.name,
        role: editFormData.role,
        isActive: editFormData.isActive,
      };
      if (editFormData.newPassword) {
        payload.password = editFormData.newPassword;
      }

      await api.put(`/users/${selectedUser._id}`, payload);
      setEditModalOpen(false);
      setFormSuccess('User account updated successfully.');
      fetchUsers();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update user account.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/users/${selectedUser._id}`);
      setFormSuccess('User deleted successfully.');
      fetchUsers();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setEditFormData({
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      newPassword: '',
    });
    setFormError('');
    setEditModalOpen(true);
  };

  const columns = [
    {
      label: 'Staff Name',
      key: 'name',
      render: (u) => (
        <div>
          <span className="font-bold text-slate-800">{u.name}</span>
          <div className="text-[11px] text-slate-500">{u.email}</div>
        </div>
      ),
    },
    {
      label: 'Assigned Role',
      key: 'role',
      render: (u) => (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-sky-50 text-sky-700 border border-sky-200">
          {u.role}
        </span>
      ),
    },
    {
      label: 'Status',
      key: 'isActive',
      render: (u) => (
        <span
          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
            u.isActive ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200' : 'bg-rose-500/10 text-rose-600 border border-rose-200'
          }`}
        >
          {u.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      label: 'Joined Date',
      key: 'createdAt',
      render: (u) => <span className="text-slate-600 font-medium">{formatDate(u.createdAt)}</span>,
    },
    {
      label: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(u)}
            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-100 transition"
            title="Edit User"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {currentUser?.id !== u._id && (
            <button
              onClick={() => {
                setSelectedUser(u);
                setDeleteDialogOpen(true);
              }}
              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-100 transition"
              title="Delete User"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Access Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Administrator management of platform users and Role-Based Access Control (RBAC) permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateFormData({
              name: '',
              email: '',
              password: 'Password123!',
              role: 'Fleet Operator',
            });
            setFormError('');
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs rounded-lg transition shadow-md shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add User Account</span>
        </button>
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Users Data Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Search staff member name or email..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filters={[
          {
            value: roleFilter,
            onChange: (val) => {
              setRoleFilter(val);
              setPage(1);
            },
            options: [
              { value: 'All', label: 'All Roles' },
              ...ROLE_OPTIONS.map((r) => ({ value: r, label: r })),
            ],
          },
        ]}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Add User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create System Account"
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
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Temporary Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              System Role *
            </label>
            <select
              value={createFormData.role}
              onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
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
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Update Staff Account: ${selectedUser?.name}`}
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
              Full Name *
            </label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              System Role *
            </label>
            <select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Account Active Status
            </label>
            <select
              value={editFormData.isActive ? 'true' : 'false'}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="true">Active (Allowed to sign in)</option>
              <option value="false">Deactivated</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
              Reset Password (Optional)
            </label>
            <input
              type="password"
              placeholder="Leave blank to preserve current password"
              value={editFormData.newPassword}
              onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
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

      {/* Delete User Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Account?"
        message={`Are you sure you want to remove ${selectedUser?.name} (${selectedUser?.email})?`}
        confirmText="Delete Account"
        danger={true}
      />
    </div>
  );
};
