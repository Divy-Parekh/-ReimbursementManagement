import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApprovals } from '../../hooks/useApprovals';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { PageLoader } from '../../components/common/Loader';
import { formatAmount, getCurrencySymbol } from '../../utils/currency';
import { Check, X, ClipboardCheck } from 'lucide-react';
import approvalService from '../../services/approvalService';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingApprovals, loading, fetchPending } = useApprovals();
  const [actionLoading, setActionLoading] = useState({});

  const handleApprove = async (expenseId, e) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [expenseId]: 'approve' }));
    try {
      await approvalService.approve(expenseId, 'Approved');
      toast.success('Expense approved!');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading((prev) => ({ ...prev, [expenseId]: null }));
    }
  };

  const handleReject = async (expenseId, e) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [expenseId]: 'reject' }));
    try {
      await approvalService.reject(expenseId, 'Rejected');
      toast.success('Expense rejected');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading((prev) => ({ ...prev, [expenseId]: null }));
    }
  };

  if (loading && pendingApprovals.length === 0) return <PageLoader text="Loading approvals..." />;

  const columns = [
    {
      key: 'description',
      label: 'Approval Subject',
      render: (_, row) => row.expense?.description || 'N/A',
    },
    {
      key: 'requestOwner',
      label: 'Request Owner',
      render: (_, row) => row.expense?.user?.name || 'Unknown',
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, row) => (
        <span className="px-2 py-0.5 rounded-md bg-surface-600 text-xs text-text-secondary">
          {row.expense?.category || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Request Status',
      render: (_, row) => <Badge status={row.expense?.status} />,
    },
    {
      key: 'amount',
      label: 'Total Amount',
      render: (_, row) => {
        const exp = row.expense;
        if (!exp) return '—';
        return (
          <div>
            <span className="text-danger font-medium text-sm">
              {formatAmount(exp.amount)} {getCurrencySymbol(exp.currency)}
              {exp.currency !== (user?.baseCurrency || 'INR') && (
                <span className="text-text-muted text-xs"> (in {user?.baseCurrency || 'INR'})</span>
              )}
            </span>
            {exp.convertedAmount && exp.currency !== (user?.baseCurrency || 'INR') && (
              <span className="block text-text-primary text-sm font-semibold">
                = {formatAmount(exp.convertedAmount)} {getCurrencySymbol(user?.baseCurrency || 'INR')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const expId = row.expense?.id;
        if (row.action !== 'PENDING') {
          return <Badge status={row.action === 'APPROVED' ? 'APPROVED' : 'REJECTED'} />;
        }
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="sm"
              icon={Check}
              onClick={(e) => handleApprove(expId, e)}
              loading={actionLoading[expId] === 'approve'}
              disabled={!!actionLoading[expId]}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={X}
              onClick={(e) => handleReject(expId, e)}
              loading={actionLoading[expId] === 'reject'}
              disabled={!!actionLoading[expId]}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Approvals to Review</h1>
          <p className="text-sm text-text-muted mt-0.5">{pendingApprovals.length} pending approvals</p>
        </div>
      </div>

      <Table
        columns={columns}
        data={pendingApprovals}
        loading={loading}
        onRowClick={(row) => navigate(`/manager/approvals/${row.expense?.id}`)}
        emptyMessage="No pending approvals. You're all caught up!"
      />
    </div>
  );
}
