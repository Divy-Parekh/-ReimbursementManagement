import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Paperclip } from 'lucide-react';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import ReceiptUploader from '../../components/expense/ReceiptUploader';
import CurrencySelector from '../../components/expense/CurrencySelector';
import { EXPENSE_CATEGORIES, PAID_BY_OPTIONS } from '../../utils/constants';
import { validateExpenseForm } from '../../utils/validators';
import expenseService from '../../services/expenseService';
import toast from 'react-hot-toast';

export default function NewExpensePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const showOCR = location.state?.useOCR || false;

  const [form, setForm] = useState({
    description: '',
    category: '',
    amount: '',
    currency: 'INR',
    expenseDate: '',
    paidBy: '',
    remarks: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [showUploader, setShowUploader] = useState(showOCR);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleOCRExtract = (fields, file) => {
    setReceiptFile(file);
    setForm((prev) => ({
      ...prev,
      description: fields.description || prev.description,
      category: fields.category || prev.category,
      amount: fields.amount?.toString() || prev.amount,
      currency: fields.currency || prev.currency,
      expenseDate: fields.date || prev.expenseDate,
    }));
    toast.success('Receipt fields extracted! Please review and adjust.');
  };

  const handleSave = async (andSubmit = false) => {
    const validationErrors = validateExpenseForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const setLoad = andSubmit ? setSubmitting : setLoading;
    setLoad(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
      };
      const response = await expenseService.create(payload);
      const expenseId = response.data.id;

      // Upload receipt if exists
      if (receiptFile) {
        await expenseService.uploadAttachment(expenseId, receiptFile);
      }

      // Submit if requested
      if (andSubmit) {
        await expenseService.submit(expenseId);
        toast.success('Expense submitted for approval!');
      } else {
        toast.success('Expense saved as draft!');
      }

      navigate('/employee');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense.');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/employee')} className="p-2 rounded-lg hover:bg-surface-700 transition-colors text-text-muted hover:text-text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">New Expense</h1>
          <p className="text-sm text-text-muted mt-0.5">Create a new expense claim</p>
        </div>
        <Button variant="outline" icon={Paperclip} onClick={() => setShowUploader(!showUploader)} size="sm">
          {showUploader ? 'Hide Uploader' : 'Attach Receipt'}
        </Button>
      </div>

      {/* Status Pipeline */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary-light font-medium">Draft</span>
          <span className="text-text-muted">›</span>
          <span className="px-3 py-1 rounded-full bg-surface-600 text-text-muted">Waiting Approval</span>
          <span className="text-text-muted">›</span>
          <span className="px-3 py-1 rounded-full bg-surface-600 text-text-muted">Approved</span>
        </div>
      </div>

      {/* Receipt Uploader */}
      {showUploader && (
        <div className="mb-6 animate-fade-in">
          <ReceiptUploader onExtract={handleOCRExtract} />
        </div>
      )}

      {/* Form */}
      <div className="glass rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column */}
          <div className="space-y-4">
            <Input
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              error={errors.description}
              placeholder="e.g., Restaurant bill"
            />
            <Select
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              error={errors.category}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder="Select category"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Total Amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={handleChange}
                error={errors.amount}
                placeholder="0.00"
              />
              <CurrencySelector
                value={form.currency}
                onChange={handleChange}
                error={errors.currency}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <Input
              label="Expense Date"
              name="expenseDate"
              type="date"
              value={form.expenseDate}
              onChange={handleChange}
              error={errors.expenseDate}
            />
            <Select
              label="Paid By"
              name="paidBy"
              value={form.paidBy}
              onChange={handleChange}
              error={errors.paidBy}
              options={PAID_BY_OPTIONS.map((p) => ({ value: p, label: p }))}
              placeholder="Who paid?"
            />
            <div className="space-y-1.5">
              <label htmlFor="remarks" className="block text-sm font-medium text-text-secondary">Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-border bg-surface-800 text-text-primary px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-border-light transition-all"
                placeholder="Optional notes..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
          <Button variant="ghost" onClick={() => navigate('/employee')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)} loading={loading}>Save Draft</Button>
          <Button onClick={() => handleSave(true)} loading={submitting}>Submit</Button>
        </div>
      </div>
    </div>
  );
}
