import { ArrowRight, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { formatAmount } from '../../utils/currency';

export default function ExpenseSummaryBar({ summary, baseCurrency = 'INR' }) {
  const cards = [
    {
      label: 'To Submit',
      amount: summary?.toSubmit?.total || 0,
      count: summary?.toSubmit?.count || 0,
      icon: TrendingUp,
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-warning',
      borderColor: 'border-warning/30',
    },
    {
      label: 'Waiting Approval',
      amount: summary?.waitingApproval?.total || 0,
      count: summary?.waitingApproval?.count || 0,
      icon: Clock,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-info',
      borderColor: 'border-info/30',
    },
    {
      label: 'Approved',
      amount: summary?.approved?.total || 0,
      count: summary?.approved?.count || 0,
      icon: CheckCircle2,
      gradient: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-success',
      borderColor: 'border-success/30',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={card.label} className="flex items-center gap-4 flex-1">
          <div className={`flex-1 glass rounded-xl p-5 border ${card.borderColor} bg-gradient-to-br ${card.gradient} transition-all duration-300 hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              <span className="text-xs text-text-muted">{card.count} expenses</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatAmount(card.amount)} <span className="text-sm font-normal text-text-muted">{baseCurrency}</span></p>
            <p className="text-sm text-text-secondary mt-1">{card.label}</p>
          </div>
          {index < cards.length - 1 && (
            <ArrowRight className="w-5 h-5 text-text-muted flex-shrink-0 hidden sm:block" />
          )}
        </div>
      ))}
    </div>
  );
}
