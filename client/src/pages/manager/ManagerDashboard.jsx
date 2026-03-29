import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApprovals } from '../../hooks/useApprovals';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { PageLoader } from '../../components/common/Loader';
import { formatAmount, getCurrencySymbol } from '../../utils/currency';
import { Check, X, ClipboardCheck, MoreHorizontal } from 'lucide-react';
import approvalService from '../../services/approvalService';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingApprovals, loading, fetchPending } = useApprovals();
  const [actionLoading, setActionLoading] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleApprove = async (expenseId, e) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [expenseId]: 'approve' }));
    try {
      await approvalService.approve(expenseId, 'Approved');
      toast.success('Expense approved!');
      setOpenMenuId(null);
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
      setOpenMenuId(null);
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
      render: (val) => val || 'N/A',
    },
    {
      key: 'requestOwner',
      label: 'Request Owner',
      render: (_, row) => row.user?.name || 'Unknown',
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, row) => (
        <span className="px-2 py-0.5 rounded-md bg-surface-600 text-xs text-text-secondary">
          {row.category || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Request Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'amount',
      label: 'Total Amount',
      render: (val, row) => {
        if (!val) return '—';
        return (
          <div>
            <span className="text-danger font-medium text-sm">
              {formatAmount(val)} {getCurrencySymbol(row.currency)}
              {row.currency !== (user?.baseCurrency || 'INR') && (
                <span className="text-text-muted text-xs"> (in {user?.baseCurrency || 'INR'})</span>
              )}
            </span>
            {row.convertedAmount && row.currency !== (user?.baseCurrency || 'INR') && (
              <span className="block text-text-primary text-sm font-semibold">
                = {formatAmount(row.convertedAmount)} {getCurrencySymbol(user?.baseCurrency || 'INR')}
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
        const expId = row.id;

        if (user?.role === 'CFO') {
          const approvedCount = row.approvalLogs?.filter(l => l.action === 'APPROVED').length || 0;
          const rejectedCount = row.approvalLogs?.filter(l => l.action === 'REJECTED').length || 0;

          return (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === expId ? null : expId); }}
                className="p-2 rounded-lg hover:bg-surface-700 text-text-muted transition-colors"
                title="Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {openMenuId === expId && (
                <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-56 bg-surface-800 border border-border rounded-xl shadow-2xl z-[9999] p-3 flex flex-col gap-3">
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Approval Stats</div>
                  <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-success">Approved: {approvedCount}</span>
                    <span className="text-danger">Rejected: {rejectedCount}</span>
                  </div>
                  <div className="h-px w-full bg-border my-1" />
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      icon={Check}
                      onClick={(e) => handleApprove(expId, e)}
                      loading={actionLoading[expId] === 'approve'}
                      disabled={!!actionLoading[expId]}
                      className="w-full justify-start"
                    >
                      Override (Approve)
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={X}
                      onClick={(e) => handleReject(expId, e)}
                      loading={actionLoading[expId] === 'reject'}
                      disabled={!!actionLoading[expId]}
                      className="w-full justify-start"
                    >
                      Override (Reject)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Normal Manager View
        if (row.status === 'APPROVED' || row.status === 'REJECTED') {
          return <Badge status={row.status} />;
        }

        if (row.action && row.action !== 'PENDING') {
          return <Badge status={row.action} />;
        }
        if (!row.action && row.status !== 'WAITING_APPROVAL') {
          return <Badge status={row.status} />;
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
          <h1 className="text-2xl font-bold text-text-primary">Global Approvals & Review</h1>
          <p className="text-sm text-text-muted mt-0.5">{pendingApprovals.length} total records to view or approve</p>
        </div>
      </div>

      <Table
        columns={columns}
        data={pendingApprovals}
        loading={loading}
        onRowClick={(row) => navigate(`/manager/approvals/${row.id}`)}
        emptyMessage="No approvals. You're all caught up!"
      />
    </div>
  );
}
