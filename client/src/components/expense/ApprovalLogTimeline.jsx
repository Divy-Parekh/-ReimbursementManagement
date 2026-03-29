import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

export default function ApprovalLogTimeline({ logs = [] }) {
  if (logs.length === 0) return null;

  const getIcon = (action) => {
    switch (action) {
      case 'APPROVED': return CheckCircle2;
      case 'REJECTED': return XCircle;
      default: return Clock;
    }
  };

  const getColor = (action) => {
    switch (action) {
      case 'APPROVED': return 'text-success bg-success/20 border-success/30';
      case 'REJECTED': return 'text-danger bg-danger/20 border-danger/30';
      default: return 'text-text-muted bg-surface-600 border-border';
    }
  };

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">Approval Log</h3>
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Approver</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {logs.map((log, idx) => {
              const IconComp = getIcon(log.action);
              const colorClass = getColor(log.action);
              return (
                <tr key={log.id || idx} className="animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-surface-600 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                      </div>
                      <span className="text-text-primary font-medium">{log.approver?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                      <IconComp className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {log.actionAt ? formatDateTime(log.actionAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {log.comments || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
