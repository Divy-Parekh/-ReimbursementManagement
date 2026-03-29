import { useNavigate } from 'react-router-dom';
import Table from '../common/Table';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/dateUtils';
import { formatAmount, getCurrencySymbol } from '../../utils/currency';

export default function ExpenseTable({ expenses, loading, onRowClick, showEmployee = false }) {
  const navigate = useNavigate();

  const columns = [
    ...(showEmployee ? [{
      key: 'user',
      label: 'Employee',
      render: (val) => val?.name || '—',
    }] : []),
    { key: 'description', label: 'Description', render: (val) => (
      <span className="max-w-[200px] truncate block">{val || '—'}</span>
    )},
    { key: 'expenseDate', label: 'Date', render: (val) => formatDate(val) },
    { key: 'category', label: 'Category', render: (val) => (
      <span className="px-2 py-0.5 rounded-md bg-surface-600 text-xs text-text-secondary">{val}</span>
    )},
    { key: 'paidBy', label: 'Paid By' },
    { key: 'remarks', label: 'Remarks', render: (val) => (
      <span className="text-text-muted max-w-[120px] truncate block">{val || 'None'}</span>
    )},
    { key: 'amount', label: 'Amount', render: (val, row) => (
      <span className="font-semibold tabular-nums">
        {formatAmount(val)} <span className="text-text-muted text-xs">{getCurrencySymbol(row.currency)}</span>
      </span>
    )},
    { key: 'status', label: 'Status', render: (val) => <Badge status={val} /> },
  ];

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row);
    } else {
      navigate(`/employee/expenses/${row.id}`);
    }
  };

  return (
    <Table
      columns={columns}
      data={expenses}
      loading={loading}
      onRowClick={handleRowClick}
      emptyMessage="No expenses found. Create your first expense!"
    />
  );
}
