import { useNavigate } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../hooks/useExpenses';
import ExpenseSummaryBar from '../../components/expense/ExpenseSummaryBar';
import ExpenseTable from '../../components/expense/ExpenseTable';
import Button from '../../components/common/Button';
import { PageLoader } from '../../components/common/Loader';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { expenses, summary, loading } = useExpenses();

  if (loading && expenses.length === 0) return <PageLoader text="Loading your expenses..." />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Expenses</h1>
          <p className="text-sm text-text-muted mt-1">Track and manage your expense claims</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => navigate('/employee/expenses/new', { state: { useOCR: true } })}
          >
            Upload Receipt
          </Button>
          <Button
            icon={Plus}
            onClick={() => navigate('/employee/expenses/new')}
          >
            New Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <ExpenseSummaryBar summary={summary} baseCurrency={user?.baseCurrency} />

      {/* Expenses Table */}
      <ExpenseTable expenses={expenses} loading={loading} />
    </div>
  );
}
