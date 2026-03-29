import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Edit, Trash2 } from 'lucide-react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { PageLoader } from '../../components/common/Loader';
import approvalRuleService from '../../services/approvalRuleService';
import toast from 'react-hot-toast';

export default function ApprovalRulesPage() {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchRules(); }, []);

  async function fetchRules() {
    try {
      const res = await approvalRuleService.getAll();
      setRules(res.data || []);
    } catch (err) {
      toast.error('Failed to load approval rules');
    } finally { setLoading(false); }
  }

  const handleDelete = async () => {
    try {
      await approvalRuleService.delete(confirmDelete.id);
      toast.success('Rule deleted');
      setConfirmDelete(null);
      fetchRules();
    } catch (err) {
      toast.error('Failed to delete rule');
    }
  };

  if (loading) return <PageLoader text="Loading approval rules..." />;

  const columns = [
    { key: 'user', label: 'User', render: (val) => <span className="font-medium">{val?.name || '—'}</span> },
    { key: 'description', label: 'Description', render: (val) => <span className="max-w-[200px] truncate block text-text-secondary">{val}</span> },
    { key: 'manager', label: 'Manager', render: (val) => val?.name || '—' },
    { key: 'isManagerApprover', label: 'Mgr Approver?', render: (val) => val ? <Badge variant="success">Yes</Badge> : <Badge variant="neutral">No</Badge> },
    { key: 'isSequential', label: 'Sequential?', render: (val) => val ? <Badge variant="primary">Sequential</Badge> : <Badge variant="secondary">Parallel</Badge> },
    { key: 'minApprovalPercentage', label: 'Min %', render: (val) => <span className="font-mono text-sm">{val}%</span> },
    { key: 'approvers', label: 'Approvers', render: (val) => <span className="text-text-muted">{val?.length || 0} approvers</span> },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/approval-rules/${row.id}/edit`); }} className="p-1.5 rounded-lg hover:bg-primary/20 text-text-muted hover:text-primary-light transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }} className="p-1.5 rounded-lg hover:bg-danger/20 text-text-muted hover:text-danger transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Approval Rules</h1>
            <p className="text-sm text-text-muted">{rules.length} rules configured</p>
          </div>
        </div>
        <Button icon={Plus} onClick={() => navigate('/admin/approval-rules/new')}>New Rule</Button>
      </div>

      <Table columns={columns} data={rules} onRowClick={(row) => navigate(`/admin/approval-rules/${row.id}/edit`)} emptyMessage="No approval rules configured yet." />

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Rule" message="Are you sure? This will remove the approval workflow for this user." confirmText="Delete" />
    </div>
  );
}
