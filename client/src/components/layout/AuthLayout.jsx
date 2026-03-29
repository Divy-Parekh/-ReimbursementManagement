import { Outlet } from 'react-router-dom';
import { Receipt } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/20 mx-auto mb-4">
            <Receipt className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">ReimburseX</h1>
          <p className="text-sm text-text-muted mt-1">Expense Reimbursement Platform</p>
        </div>

        {/* Auth form container */}
        <div className="glass rounded-2xl p-8 shadow-2xl animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
