import { useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { BellRing, CheckCircle2, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { notifications, loading, loadAll, markAsRead, markAllAsRead, unreadCount } = useNotification();

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BellRing className="w-6 h-6 text-primary-light" />
            All Notifications
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Stay updated with your latest approval activities and system alerts.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-primary/10 text-primary-light hover:bg-primary/20 rounded-xl font-medium transition-colors border border-primary/20 hover:border-primary/40 flex items-center gap-2 self-start sm:self-auto"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-surface-800 rounded-2xl border border-border shadow-sm overflow-hidden glass">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-text-muted">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-surface-700/50 flex items-center justify-center mb-4">
              <BellRing className="w-8 h-8 text-text-muted/50" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">No notifications yet</h3>
            <p className="text-text-muted mt-1">When you get notifications, they'll show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`p-4 sm:px-6 sm:py-5 flex gap-4 transition-colors ${
                  notif.isRead 
                    ? 'hover:bg-surface-700/30' 
                    : 'bg-primary/5 cursor-pointer hover:bg-primary/10'
                }`}
              >
                <div className="pt-1">
                  {notif.isRead ? (
                    <CheckCircle2 className="w-5 h-5 text-text-muted/50" />
                  ) : (
                    <Circle className="w-5 h-5 text-primary-light fill-primary-light/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <h4 className={`text-base truncate pr-4 ${notif.isRead ? 'font-medium text-text-secondary' : 'font-semibold text-text-primary'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-text-muted whitespace-nowrap mt-1 sm:mt-0 font-medium uppercase shrink-0">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${notif.isRead ? 'text-text-muted' : 'text-text-secondary'}`}>
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
