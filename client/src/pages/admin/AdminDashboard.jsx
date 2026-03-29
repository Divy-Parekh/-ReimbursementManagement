import { Link } from 'react-router-dom';
import { Users, Shield, FileText, ArrowRight, TrendingUp, BarChart3 } from 'lucide-react';
import Card from '../../components/common/Card';

const quickActions = [
  {
    title: 'User Management',
    description: 'Create employees & managers, assign roles & managers',
    icon: Users,
    to: '/admin/users',
    gradient: 'from-primary/20 to-primary-dark/20',
    iconColor: 'text-primary-light',
  },
  {
    title: 'Approval Rules',
    description: 'Configure approval workflows for users',
    icon: Shield,
    to: '/admin/approval-rules',
    gradient: 'from-secondary/20 to-secondary-dark/20',
    iconColor: 'text-secondary',
  },
  {
    title: 'All Expenses',
    description: 'View and manage all company expenses',
    icon: FileText,
    to: '/admin/expenses',
    gradient: 'from-accent/20 to-accent-dark/20',
    iconColor: 'text-accent',
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Manage your company's reimbursement system</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', value: '—', icon: Users, color: 'text-primary-light' },
          { label: 'Pending Approvals', value: '—', icon: TrendingUp, color: 'text-warning' },
          { label: 'Active Rules', value: '—', icon: BarChart3, color: 'text-secondary' },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-sm text-text-muted">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to}>
            <Card hover className={`bg-gradient-to-br ${action.gradient} h-full group`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-surface-800/50 flex items-center justify-center">
                  <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">{action.title}</h3>
              <p className="text-sm text-text-muted">{action.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
