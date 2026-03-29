import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import ExpenseTable from '../../components/expense/ExpenseTable';
import { PageLoader } from '../../components/common/Loader';
import expenseService from '../../services/expenseService';
import toast from 'react-hot-toast';

export default function AllExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await expenseService.getAll();
        setExpenses(res.data || []);
      } catch (err) {
        toast.error('Failed to load expenses');
      } finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return <PageLoader text="Loading all expenses..." />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">All Expenses</h1>
          <p className="text-sm text-text-muted">{expenses.length} expenses across the company</p>
        </div>
      </div>

      <ExpenseTable expenses={expenses} loading={loading} showEmployee onRowClick={() => {}} />
    </div>
  );
}
