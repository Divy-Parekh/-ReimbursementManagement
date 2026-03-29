import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ApprovalLogTimeline from '../../components/expense/ApprovalLogTimeline';
import CurrencySelector from '../../components/expense/CurrencySelector';
import { PageLoader } from '../../components/common/Loader';
import { EXPENSE_CATEGORIES, EXPENSE_STATUS, PAID_BY_OPTIONS } from '../../utils/constants';
import { formatDateInput } from '../../utils/dateUtils';
import { validateExpenseForm } from '../../utils/validators';
import expenseService from '../../services/expenseService';
import approvalService from '../../services/approvalService';
import toast from 'react-hot-toast';

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [approvalLogs, setApprovalLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const isDraft = expense?.status === EXPENSE_STATUS.DRAFT;
  const isRejected = expense?.status === EXPENSE_STATUS.REJECTED;
  const isEditable = isDraft || isRejected;
  const isReadOnly = !isEditable;

  useEffect(() => {
    fetchExpense();
  }, [id]);

  async function fetchExpense() {
    try {
      const res = await expenseService.getById(id);
      const data = res.data;
      setExpense(data);
      setForm({
        description: data.description || '',
        category: data.category || '',
        amount: data.amount?.toString() || '',
        currency: data.currency || 'INR',
        expenseDate: formatDateInput(data.expenseDate) || '',
        paidBy: data.paidBy || '',
        remarks: data.remarks || '',
      });

      if (data.status !== EXPENSE_STATUS.DRAFT) {
        const logs = await approvalService.getLogs(id);
        setApprovalLogs(logs.data || []);
      }
    } catch (err) {
      toast.error('Failed to load expense');
      navigate('/employee');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    if (isReadOnly) return;
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSave = async () => {
    const validationErrors = validateExpenseForm(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setSaving(true);
    try {
      await expenseService.update(id, { ...form, amount: parseFloat(form.amount) });
      toast.success('Expense updated!');
      fetchExpense();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    const validationErrors = validateExpenseForm(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setSubmitting(true);
    try {
      // Save first, then submit
      await expenseService.update(id, { ...form, amount: parseFloat(form.amount) });
      await expenseService.submit(id);
      toast.success('Expense submitted for approval!');
      fetchExpense();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return <PageLoader text="Loading expense..." />;

  // Status pipeline
  const statuses = ['DRAFT', 'WAITING_APPROVAL', 'APPROVED'];
  const currentIdx = statuses.indexOf(expense?.status === 'SUBMITTED' ? 'WAITING_APPROVAL' : expense?.status);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/employee')} className="p-2 rounded-lg hover:bg-surface-700 transition-colors text-text-muted hover:text-text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Expense Detail</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge status={expense?.status} />
            {isReadOnly && <span className="text-xs text-text-muted">(Read-only)</span>}
          </div>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex items-center justify-center gap-2 text-sm">
          {statuses.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full font-medium ${
                i <= currentIdx ? 'bg-primary/20 text-primary-light' : 'bg-surface-600 text-text-muted'
              }`}>
                {s === 'DRAFT' ? 'Draft' : s === 'WAITING_APPROVAL' ? 'Waiting Approval' : 'Approved'}
              </span>
              {i < statuses.length - 1 && <span className="text-text-muted">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="glass rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <Input label="Description" name="description" value={form.description} onChange={handleChange} error={errors.description} disabled={isReadOnly} placeholder="e.g., Restaurant bill" />
            <Select label="Category" name="category" value={form.category} onChange={handleChange} error={errors.category} disabled={isReadOnly} options={EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Total Amount" name="amount" type="number" step="0.01" min="0" value={form.amount} onChange={handleChange} error={errors.amount} disabled={isReadOnly} />
              <CurrencySelector value={form.currency} onChange={handleChange} error={errors.currency} />
            </div>
          </div>
          <div className="space-y-4">
            <Input label="Expense Date" name="expenseDate" type="date" value={form.expenseDate} onChange={handleChange} error={errors.expenseDate} disabled={isReadOnly} />
            <Select label="Paid By" name="paidBy" value={form.paidBy} onChange={handleChange} error={errors.paidBy} disabled={isReadOnly} options={PAID_BY_OPTIONS.map(p => ({ value: p, label: p }))} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">Remarks</label>
              <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3} disabled={isReadOnly} className="w-full rounded-lg border border-border bg-surface-800 text-text-primary px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all" placeholder="Optional notes..." />
            </div>
          </div>
        </div>

        {/* Actions — for draft or rejected */}
        {isEditable && (
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
            <Button variant="secondary" onClick={handleSave} loading={saving}>Save</Button>
            <Button onClick={handleSubmit} loading={submitting}>{isRejected ? 'Resubmit' : 'Submit'}</Button>
          </div>
        )}
      </div>

      {/* Approval Log — shown after submission */}
      {isReadOnly && approvalLogs.length > 0 && (
        <div className="mt-6 animate-fade-in">
          <ApprovalLogTimeline logs={approvalLogs} />
        </div>
      )}
    </div>
  );
}
