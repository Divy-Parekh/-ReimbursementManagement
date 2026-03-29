import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  icon: Icon,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-primary hover:bg-primary-light text-white focus:ring-primary shadow-lg shadow-primary/20 hover:shadow-primary/40',
    secondary: 'bg-surface-600 hover:bg-surface-500 text-text-primary focus:ring-surface-500 border border-border',
    danger: 'bg-danger hover:bg-red-600 text-white focus:ring-danger shadow-lg shadow-danger/20',
    success: 'bg-success hover:bg-green-500 text-white focus:ring-success shadow-lg shadow-success/20',
    ghost: 'bg-transparent hover:bg-surface-700 text-text-secondary hover:text-text-primary focus:ring-surface-500',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10 focus:ring-primary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </button>
  );
}
