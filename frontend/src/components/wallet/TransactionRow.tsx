import { ArrowDownLeft, ArrowUpRight, PlusCircle } from 'lucide-react'; 
import { StatusBadge } from '../common/StatusBadge';
import type { WalletTransaction } from '../../types/api';

const TYPE_LABELS: Record<WalletTransaction['type'], string> = {
  TOPUP: 'Top up',
  TRANSFER_OUT: 'Sent',
  TRANSFER_IN: 'Received',
};

const TYPE_ICON: Record<WalletTransaction['type'], typeof PlusCircle> = {
  TOPUP: PlusCircle,
  TRANSFER_OUT: ArrowUpRight,
  TRANSFER_IN: ArrowDownLeft,
};

const TYPE_ICON_CLASSES: Record<WalletTransaction['type'], string> = {
  TOPUP: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  TRANSFER_OUT: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  TRANSFER_IN: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
};

function describeCounterparty(tx: WalletTransaction): string {
  if (tx.type === 'TOPUP') return 'From linked bank account';
  if (tx.recipientSnapshot?.name) return tx.recipientSnapshot.name;
  if (tx.recipientIban) return tx.recipientIban;
  return '—';
}

export function TransactionRow({
  transaction,
  ownerLabel,
}: {
  transaction: WalletTransaction;
  ownerLabel?: string;
}) {
  const isCredit = transaction.type === 'TOPUP' || transaction.type === 'TRANSFER_IN';
  const Icon = TYPE_ICON[transaction.type];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-gray-200/70 hover:bg-gray-50 dark:hover:border-white/10 dark:hover:bg-white/3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TYPE_ICON_CLASSES[transaction.type]}`}>
        <Icon size={18} strokeWidth={2.25} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {TYPE_LABELS[transaction.type]}
          {ownerLabel && <span className="ml-1.5 font-normal text-gray-400">· {ownerLabel}</span>}
        </p>
        <p className="truncate text-xs text-gray-400">{describeCounterparty(transaction)}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`text-sm font-semibold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}
        >
          {isCredit ? '+' : '-'}
          {Number(transaction.amount).toFixed(2)} {transaction.currency}
        </span>
        <StatusBadge status={transaction.status} />
      </div>
    </div>
  );
}
