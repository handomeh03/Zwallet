import { ArrowDownLeft, ArrowUpRight, Clock, PlusCircle } from 'lucide-react';
import type { WalletTransaction } from '../../types/api';

function sum(transactions: WalletTransaction[], predicate: (tx: WalletTransaction) => boolean): number {
  return transactions.filter(predicate).reduce((total, tx) => total + Number(tx.amount), 0);
}

export function StatsRow({ transactions }: { transactions: WalletTransaction[] }) {
  const totalReceived = sum(
    transactions,
    (tx) => tx.type === 'TRANSFER_IN' && tx.status === 'COMPLETED',
  );
  const totalSent = sum(transactions, (tx) => tx.type === 'TRANSFER_OUT' && tx.status === 'COMPLETED');
  const totalToppedUp = sum(transactions, (tx) => tx.type === 'TOPUP' && tx.status === 'COMPLETED');
  const pendingCount = transactions.filter((tx) => tx.status === 'PENDING').length;

  const stats = [
    {
      label: 'Received',
      value: totalReceived,
      icon: ArrowDownLeft,
      classes: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    {
      label: 'Sent',
      value: totalSent,
      icon: ArrowUpRight,
      classes: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
    },
    {
      label: 'Topped up',
      value: totalToppedUp,
      icon: PlusCircle,
      classes: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, classes }) => (
        <div key={label} className="glass-card p-4">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${classes}`}>
            <Icon size={16} strokeWidth={2.25} />
          </span>
          <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">{value.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{label} (JOD)</p>
        </div>
      ))}

      <div className="glass-card p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
          <Clock size={16} strokeWidth={2.25} />
        </span>
        <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">{pendingCount}</p>
        <p className="text-xs text-gray-400">Pending now</p>
      </div>
    </div>
  );
}
