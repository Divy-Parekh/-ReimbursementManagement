export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Office Supplies',
  'Accommodation',
  'Transportation',
  'Entertainment',
  'Miscellaneous',
];

export const EXPENSE_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const EXPENSE_STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  WAITING_APPROVAL: 'Waiting Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const EXPENSE_STATUS_COLORS = {
  DRAFT: { bg: 'bg-surface-600', text: 'text-text-secondary', dot: 'bg-text-muted' },
  SUBMITTED: { bg: 'bg-info/20', text: 'text-info', dot: 'bg-info' },
  WAITING_APPROVAL: { bg: 'bg-warning/20', text: 'text-warning', dot: 'bg-warning' },
  APPROVED: { bg: 'bg-success/20', text: 'text-success', dot: 'bg-success' },
  REJECTED: { bg: 'bg-danger/20', text: 'text-danger', dot: 'bg-danger' },
};

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

export const PAID_BY_OPTIONS = ['Employee', 'Company'];

export const API_BASE_URL = '/api';
