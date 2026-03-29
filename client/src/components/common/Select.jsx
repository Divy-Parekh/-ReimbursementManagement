import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  error,
  options = [],
  placeholder = 'Select...',
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-4 h-4 text-text-muted" />
          </div>
        )}
        <select
          id={selectId}
          className={`w-full rounded-lg border bg-surface-800 text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none ${
            Icon ? 'pl-10' : 'pl-4'
          } pr-10 py-2.5 text-sm ${
            error ? 'border-danger focus:ring-danger/50' : 'border-border hover:border-border-light'
          }`}
          {...props}
        >
          <option value="" className="bg-surface-800">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-800">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </div>
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
