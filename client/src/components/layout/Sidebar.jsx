import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  PlusCircle,
  ClipboardCheck,
  User as UserIcon,
  BellRing,
  LogOut
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

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();

  let roleLinks = [];
  if (user?.role === 'ADMIN') roleLinks = adminLinks;
  else if (user?.role === 'MANAGER' || user?.role === 'CFO') roleLinks = managerLinks;
  else if (user?.role === 'EMPLOYEE') roleLinks = employeeLinks;

  const commonLinks = [
    { to: '/notifications', icon: BellRing, label: 'Notifications' },
    { to: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  const renderLink = (link) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={['/admin', '/manager', '/employee'].includes(link.to)}
      className={({ isActive }) =>
        `flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
          isActive
            ? 'bg-primary/15 text-primary-light shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-700/50'
        }`
      }
      title={collapsed ? link.label : undefined}
    >
      {({ isActive }) => (
        <>
          <link.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-text-secondary'}`} />
          {!collapsed && (
            <>
              {link.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />}
            </>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} min-h-[calc(100vh-4rem)] border-r border-border glass p-4 transition-all duration-300 flex-col hidden lg:flex`}>
      <div className="flex-1 space-y-1">
        {roleLinks.map(renderLink)}
        {commonLinks.map(renderLink)}
      </div>

      <div className="mt-auto space-y-4">
        <button
          onClick={logout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200 group`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          {!collapsed && 'Logout'}
        </button>

        <div className={`pt-4 border-t border-border/50 flex ${collapsed ? 'justify-center' : 'items-center gap-3 px-2'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex shrink-0 items-center justify-center">
            <span className="text-sm font-bold text-white uppercase">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold truncate">
                {user?.role}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
