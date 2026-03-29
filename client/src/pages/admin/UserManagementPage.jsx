import { useState, useEffect } from 'react';
import { Plus, Send, Trash2, Users } from 'lucide-react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { PageLoader } from '../../components/common/Loader';
import userService from '../../services/userService';
import toast from 'react-hot-toast';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [sendingPwd, setSendingPwd] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: '', managerId: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await userService.getAll();
      setUsers(res.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally { setLoading(false); }
  }

  const managers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', role: '', managerId: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, managerId: user.managerId || '' });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    if (!form.role) errs.role = 'Role is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (editUser) {
        await userService.update(editUser.id, form);
        toast.success('User updated!');
      } else {
        await userService.create(form);
        toast.success('User created!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleSendPassword = async (userId, e) => {
    e.stopPropagation();
    setSendingPwd((prev) => ({ ...prev, [userId]: true }));
    try {
      await userService.sendPassword(userId);
      toast.success('Password sent via email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send password');
    } finally {
      setSendingPwd((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async () => {
    try {
      await userService.delete(confirmDelete.id);
      toast.success('User deleted');
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <PageLoader text="Loading users..." />;

  const columns = [
    { key: 'name', label: 'User', render: (val) => <span className="font-medium">{val}</span> },
    { key: 'role', label: 'Role', render: (val) => <Badge role={val} /> },
    { key: 'manager', label: 'Manager', render: (val) => val?.name || '—' },
    { key: 'email', label: 'Email', render: (val) => <span className="text-text-secondary">{val}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        if (row.role === 'ADMIN') return <span className="text-xs text-text-muted">Admin</span>;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Send}
              onClick={(e) => handleSendPassword(row.id, e)}
              loading={sendingPwd[row.id]}
            >
              Send Password
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}
              className="p-1.5 rounded-lg hover:bg-danger/20 text-text-muted hover:text-danger transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-light" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
            <p className="text-sm text-text-muted">{users.length} users</p>
          </div>
        </div>
        <Button icon={Plus} onClick={openCreate}>New User</Button>
      </div>

      <Table columns={columns} data={users} onRowClick={(row) => row.role !== 'ADMIN' && openEdit(row)} emptyMessage="No users yet. Create your first user!" />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? 'Edit User' : 'Create User'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editUser ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Full name" />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="user@company.com" disabled={!!editUser} />
          <Select
            label="Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            error={errors.role}
            options={[
              { value: 'MANAGER', label: 'Manager' },
              { value: 'EMPLOYEE', label: 'Employee' },
            ]}
          />
          <Select
            label="Manager"
            name="managerId"
            value={form.managerId}
            onChange={handleChange}
            options={managers.map((m) => ({ value: m.id, label: m.name }))}
            placeholder="Select manager (optional)"
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${confirmDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
