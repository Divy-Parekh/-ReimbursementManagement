import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { LogOut, User, Receipt, Menu, Sun, Moon, Bell } from 'lucide-react';
import NotificationModal from './NotificationModal';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="h-16 border-b border-border glass sticky top-0 z-40">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="p-2 flex lg:hidden items-center justify-center rounded-lg hover:bg-surface-700/50 text-text-muted transition-colors mr-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight hidden sm:block">ReimburseX</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-surface-700 transition-colors text-text-secondary"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-full hover:bg-surface-700 transition-colors text-text-secondary relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-surface-900 animate-pulse-glow" />
              )}
            </button>
            <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
          </div>
        </div>
      </div>
    </nav>
  );
}
