import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  PlusCircle,
  ClipboardCheck,
  Receipt,
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/approval-rules', icon: Shield, label: 'Approval Rules' },
  { to: '/admin/expenses', icon: FileText, label: 'All Expenses' },
];

const managerLinks = [
  { to: '/manager', icon: ClipboardCheck, label: 'Approvals' },
];

const employeeLinks = [
  { to: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/expenses/new', icon: PlusCircle, label: 'New Expense' },
];

export default function Sidebar() {
  const { user } = useAuth();

  let links = [];
  if (user?.role === 'ADMIN') links = adminLinks;
  else if (user?.role === 'MANAGER') links = managerLinks;
  else if (user?.role === 'EMPLOYEE') links = employeeLinks;

  return (
    <aside className="w-64 border-r border-border glass min-h-[calc(100vh-4rem)] p-4 hidden lg:block">
      <div className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/manager' || link.to === '/employee'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/15 text-primary-light shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-text-secondary'}`} />
                {link.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom section */}
      <div className="mt-8 px-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-primary-light" />
            <span className="text-xs font-semibold text-primary-light">ReimburseX</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Streamline your expense approvals with automated workflows.
          </p>
        </div>
      </div>
    </aside>
  );
}
