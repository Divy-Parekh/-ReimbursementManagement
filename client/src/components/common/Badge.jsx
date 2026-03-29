import { EXPENSE_STATUS_COLORS, EXPENSE_STATUS_LABELS, ROLE_LABELS } from '../../utils/constants';

export default function Badge({ status, role, children, variant, className = '' }) {
  if (status) {
    const colors = EXPENSE_STATUS_COLORS[status] || { bg: 'bg-surface-600', text: 'text-text-secondary', dot: 'bg-text-muted' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        {EXPENSE_STATUS_LABELS[status] || status}
      </span>
    );
  }

  if (role) {
    const roleColors = {
      ADMIN: 'bg-accent/20 text-accent',
      MANAGER: 'bg-secondary/20 text-secondary',
      EMPLOYEE: 'bg-primary/20 text-primary-light',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[role] || 'bg-surface-600 text-text-secondary'} ${className}`}>
        {ROLE_LABELS[role] || role}
      </span>
    );
  }

  const variantClasses = {
    primary: 'bg-primary/20 text-primary-light',
    secondary: 'bg-secondary/20 text-secondary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger',
    neutral: 'bg-surface-600 text-text-secondary',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variantClasses[variant] || variantClasses.neutral} ${className}`}>
      {children}
    </span>
  );
}
