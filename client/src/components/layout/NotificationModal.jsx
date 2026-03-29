import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { BellRing, Check, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationModal({ isOpen, onClose }) {
  const { notifications, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const recent = notifications.slice(0, 4);

  const handleRead = async (id) => {
    await markAsRead(id);
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-surface-800 border border-border shadow-2xl rounded-2xl overflow-hidden z-50 animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <BellRing className="w-4 h-4 text-primary-light" />
          Notifications
        </h3>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-primary-light hover:text-primary transition-colors flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Mark all
          </button>
        )}
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {recent.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recent.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleRead(notif.id)}
                className={`p-4 cursor-pointer transition-colors hover:bg-surface-700/50 ${!notif.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className="flex gap-3">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-primary-light' : 'bg-transparent'}`} />
                  <div>
                    <p className={`text-sm ${!notif.isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-text-muted mt-2 uppercase font-medium">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border/50 bg-surface-900">
        <button
          onClick={handleViewAll}
          className="w-full py-2 text-sm font-medium text-primary-light hover:bg-surface-700/50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          View all notifications <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
