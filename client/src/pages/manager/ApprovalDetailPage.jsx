import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import ApprovalLogTimeline from '../../components/expense/ApprovalLogTimeline';
import { PageLoader } from '../../components/common/Loader';
import { formatDate } from '../../utils/dateUtils';
import { formatAmount, getCurrencySymbol } from '../../utils/currency';
import expenseService from '../../services/expenseService';
import approvalService from '../../services/approvalService';
import toast from 'react-hot-toast';

export default function ApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expense, setExpense] = useState(null);
  const [logs, setLogs] = useState([]);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    try {
      const [expRes, logRes] = await Promise.all([
        expenseService.getById(id),
        approvalService.getLogs(id),
      ]);
      setExpense(expRes.data);
      setLogs(logRes.data || []);
    } catch (err) {
      toast.error('Failed to load expense');
      navigate('/manager');
    } finally { setLoading(false); }
  }

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'approve') {
        await approvalService.approve(id, comments);
        toast.success('Expense approved!');
      } else {
        await approvalService.reject(id, comments);
        toast.success('Expense rejected');
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action}`);
    } finally { setActionLoading(null); }
  };

  if (loading) return <PageLoader />;

  const canAct = expense?.status === 'WAITING_APPROVAL' || expense?.status === 'SUBMITTED';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/manager')} className="p-2 rounded-lg hover:bg-surface-700 transition-colors text-text-muted hover:text-text-primary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Expense Review</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge status={expense?.status} />
            <span className="text-sm text-text-muted">by {expense?.user?.name}</span>
          </div>
        </div>
      </div>

      {/* Expense Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Expense Details</h3>
          <div className="space-y-3">
            <DetailRow label="Description" value={expense?.description} />
            <DetailRow label="Category" value={expense?.category} />
            <DetailRow label="Date" value={formatDate(expense?.expenseDate)} />
            <DetailRow label="Paid By" value={expense?.paidBy} />
            <DetailRow label="Remarks" value={expense?.remarks || 'None'} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Amount</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">Original Amount</p>
              <p className="text-2xl font-bold text-danger">
                {formatAmount(expense?.amount)} {getCurrencySymbol(expense?.currency)}
                <span className="text-sm font-normal text-text-muted ml-1">({expense?.currency})</span>
              </p>
            </div>
            {expense?.convertedAmount && expense?.currency !== (user?.baseCurrency || 'INR') && (
              <div>
                <p className="text-sm text-text-muted">Converted ({user?.baseCurrency || 'INR'})</p>
                <p className="text-2xl font-bold text-text-primary">
                  = {formatAmount(expense?.convertedAmount)} {getCurrencySymbol(user?.baseCurrency || 'INR')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Approval Actions */}
      {canAct && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Your Decision</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Comments</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-surface-800 text-text-primary px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Add your comments (optional)..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="success" icon={Check} onClick={() => handleAction('approve')} loading={actionLoading === 'approve'} disabled={!!actionLoading}>
                Approve Expense
              </Button>
              <Button variant="danger" icon={X} onClick={() => handleAction('reject')} loading={actionLoading === 'reject'} disabled={!!actionLoading}>
                Reject Expense
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Approval Log */}
      {logs.length > 0 && <ApprovalLogTimeline logs={logs} />}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm text-text-primary font-medium text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}
