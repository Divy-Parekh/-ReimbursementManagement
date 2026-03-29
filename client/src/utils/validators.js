export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 8;
}

export function validateRequired(value, fieldName = 'Field') {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateMinLength(value, min, fieldName = 'Field') {
  if (value && value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return null;
}

export function validatePasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}

export function validatePositiveNumber(value, fieldName = 'Field') {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    return `${fieldName} must be a positive number`;
  }
  return null;
}

export function validateSignupForm(data) {
  const errors = {};
  if (!data.name || data.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!validateEmail(data.email)) errors.email = 'Valid email is required';
  if (!validatePassword(data.password)) errors.password = 'Password must be at least 8 characters';
  if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (!data.country) errors.country = 'Country is required';
  return errors;
}

export function validateLoginForm(data) {
  const errors = {};
  if (!validateEmail(data.email)) errors.email = 'Valid email is required';
  if (!data.password) errors.password = 'Password is required';
  return errors;
}

export function validateExpenseForm(data) {
  const errors = {};
  if (!data.description || data.description.trim().length < 3) errors.description = 'Description must be at least 3 characters';
  if (!data.category) errors.category = 'Category is required';
  const amt = parseFloat(data.amount);
  if (isNaN(amt) || amt <= 0) errors.amount = 'Amount must be a positive number';
  if (!data.currency) errors.currency = 'Currency is required';
  if (!data.expenseDate) errors.expenseDate = 'Expense date is required';
  if (!data.paidBy) errors.paidBy = 'Paid by is required';
  return errors;
}
