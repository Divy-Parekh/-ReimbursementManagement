import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
        <p className="text-xl text-text-secondary mb-2">Page Not Found</p>
        <p className="text-sm text-text-muted mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button icon={Home}>Go Home</Button>
          </Link>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
