import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { PageLoader } from '../../components/common/Loader';
import userService from '../../services/userService';
import approvalRuleService from '../../services/approvalRuleService';
import toast from 'react-hot-toast';

export default function ApprovalRuleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    userId: '',
    description: '',
    managerId: '',
    isManagerApprover: false,
    isSequential: false,
    minApprovalPercentage: 100,
  });
  const [approvers, setApprovers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const usersRes = await userService.getAll();
      setUsers(usersRes.data || []);

      if (isEdit) {
        const ruleRes = await approvalRuleService.getById(id);
        const rule = ruleRes.data;
        setForm({
          userId: rule.userId || rule.user?.id || '',
          description: rule.description || '',
          managerId: rule.managerId || rule.manager?.id || '',
          isManagerApprover: rule.isManagerApprover || false,
          isSequential: rule.isSequential || false,
          minApprovalPercentage: rule.minApprovalPercentage || 100,
        });
        setApprovers(
          (rule.approvers || []).map((a) => ({
            userId: a.userId || a.user?.id,
            userName: a.user?.name || '',
            sequenceOrder: a.sequenceOrder,
            isRequired: a.isRequired,
            isOverride: a.isOverride || false,
          }))
        );
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally { setLoading(false); }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'userId') {
      const selectedUser = users.find(u => u.id === value);
      if (selectedUser?.managerId) {
        setForm(prev => ({ 
          ...prev, 
          userId: value, 
          managerId: selectedUser.managerId, 
          isManagerApprover: true 
        }));
      } else {
        setForm(prev => ({ ...prev, userId: value, isManagerApprover: false, managerId: '' }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const addApprover = () => {
    setApprovers((prev) => [
      ...prev,
      { userId: '', userName: '', sequenceOrder: prev.length + 1, isRequired: false },
    ]);
  };

  const removeApprover = (idx) => {
    setApprovers((prev) => prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, sequenceOrder: i + 1 })));
  };

  const updateApprover = (idx, field, value) => {
    setApprovers((prev) => prev.map((a, i) => {
      if (i !== idx) return a;
      if (field === 'userId') {
        const user = users.find((u) => u.id === value);
        return { ...a, userId: value, userName: user?.name || '' };
      }
      return { ...a, [field]: value };
    }));
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.userId) errs.userId = 'User is required';
    if (!form.description || form.description.length < 5) errs.description = 'Description must be at least 5 chars';
    if (approvers.length === 0) errs.approvers = 'At least one approver is required';
    if (approvers.some((a) => !a.userId)) errs.approvers = 'All approvers must have a user selected';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = {
      ...form,
      minApprovalPercentage: parseFloat(form.minApprovalPercentage) || 100,
      approvers: approvers.map((a) => ({
        userId: a.userId,
        sequenceOrder: a.sequenceOrder,
        isRequired: a.isRequired,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await approvalRuleService.update(id, payload);
        toast.success('Rule updated!');
      } else {
        await approvalRuleService.create(payload);
        toast.success('Rule created!');
      }
      navigate('/admin/approval-rules');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rule');
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;

  const userOptions = users.filter((u) => u.role !== 'ADMIN').map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }));
  const managerOptions = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN').map((u) => ({ value: u.id, label: u.name }));
  const approverOptions = users.filter((u) => u.role !== 'ADMIN').map((u) => ({ value: u.id, label: u.name }));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/approval-rules')} className="p-2 rounded-lg hover:bg-surface-700 transition-colors text-text-muted hover:text-text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">{isEdit ? 'Edit' : 'New'} Approval Rule</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Rule Details */}
        <Card>
          <h2 className="text-base font-semibold text-text-primary mb-4">Rule Details</h2>
          <div className="space-y-4">
            <Select label="User" name="userId" value={form.userId} onChange={handleChange} error={errors.userId} options={userOptions} placeholder="Select user this rule applies to" />
            <Input label="Description about rules" name="description" value={form.description} onChange={handleChange} error={errors.description} placeholder="e.g., Approval rule for miscellaneous expenses" />
            <Select label="Manager" name="managerId" value={form.managerId} onChange={handleChange} options={managerOptions} placeholder="Select manager" />
          </div>
        </Card>

        {/* Right: Approvers Config */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Approvers</h2>
            {/* Is Manager Approver */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isManagerApprover" checked={form.isManagerApprover} onChange={handleChange} className="w-4 h-4 rounded border-border bg-surface-700 text-primary focus:ring-primary/50 cursor-pointer" />
              <span className="text-sm text-text-secondary">Is manager an approver?</span>
            </label>
          </div>

          {/* Approvers Table */}
          <div className="glass-light rounded-lg overflow-hidden mb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-text-muted w-10">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-text-muted">User</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-text-muted w-24">Required</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {approvers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-text-muted">
                      No approvers added yet
                    </td>
                  </tr>
                ) : (
                  approvers.map((approver, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-sm text-text-muted">
                        <div className="flex items-center gap-1">
                          <GripVertical className="w-3 h-3 text-text-muted opacity-50" />
                          {approver.sequenceOrder}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={approver.userId}
                          onChange={(e) => updateApprover(idx, 'userId', e.target.value)}
                          className="w-full rounded-md border border-border bg-surface-800 text-text-primary px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="">Select...</option>
                          {approverOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={approver.isRequired}
                          onChange={(e) => updateApprover(idx, 'isRequired', e.target.checked)}
                          className="w-4 h-4 rounded border-border bg-surface-700 text-primary focus:ring-primary/50 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeApprover(idx)} className="p-1 rounded hover:bg-danger/20 text-text-muted hover:text-danger transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {errors.approvers && <p className="text-xs text-danger mb-2">{errors.approvers}</p>}
          <Button variant="ghost" size="sm" icon={Plus} onClick={addApprover}>Add Approver</Button>

          {/* Settings */}
          <div className="mt-6 pt-4 border-t border-border space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isSequential" checked={form.isSequential} onChange={handleChange} className="w-4 h-4 rounded border-border bg-surface-700 text-primary focus:ring-primary/50 cursor-pointer" />
              <span className="text-sm text-text-secondary">Approvers Sequence</span>
            </label>
            <p className="text-xs text-text-muted -mt-2 ml-6">
              {form.isSequential
                ? 'Checked: Requests go to approvers one by one in sequence order.'
                : 'Unchecked: Requests are sent to all approvers simultaneously.'}
            </p>

            <div className="flex items-center gap-3">
              <label className="text-sm text-text-secondary whitespace-nowrap">Minimum Approval %:</label>
              <input
                type="number"
                name="minApprovalPercentage"
                value={form.minApprovalPercentage}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-20 rounded-md border border-border bg-surface-800 text-text-primary px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <span className="text-sm text-text-muted">%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={() => navigate('/admin/approval-rules')}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>{isEdit ? 'Update Rule' : 'Create Rule'}</Button>
      </div>
    </div>
  );
}
