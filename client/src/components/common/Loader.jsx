import { Loader2 } from 'lucide-react';

export default function Loader({ size = 'md', text = '', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizes[size]} text-primary animate-spin`} />
      {text && <p className="text-sm text-text-muted">{text}</p>}
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size="lg" text={text} />
    </div>
  );
}
