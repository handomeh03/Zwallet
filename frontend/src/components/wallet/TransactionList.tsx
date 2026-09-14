import { Inbox } from 'lucide-react';
import type { WalletTransaction } from '../../types/api';
import { TransactionRow } from './TransactionRow';

export function TransactionList({
  transactions,
  emptyMessage = 'No transactions yet',
}: {
  transactions: WalletTransaction[];
  emptyMessage?: string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
        <Inbox size={28} strokeWidth={1.5} />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} transaction={tx} />
      ))}
    </div>
  );
}
