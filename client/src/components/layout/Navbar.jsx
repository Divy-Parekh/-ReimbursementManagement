import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Receipt } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="h-16 border-b border-border glass sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight">ReimburseX</span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface-700/50">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary leading-none">{user?.name || 'User'}</p>
              <p className="text-xs text-text-muted mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-surface-700 transition-colors text-text-muted hover:text-danger group"
            title="Logout"
          >
            <LogOut className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
}
