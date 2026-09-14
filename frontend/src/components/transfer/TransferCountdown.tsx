import { useNavigate } from 'react-router-dom';
import { Ban, CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import type { WalletTransaction } from '../../types/api';

const RESOLVED_CONFIG = {
  COMPLETED: { icon: CheckCircle2, classes: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/15' },
  CANCELLED: { icon: Ban, classes: 'text-gray-400 bg-gray-100 dark:bg-white/10' },
  FAILED: { icon: XCircle, classes: 'text-rose-500 bg-rose-100 dark:bg-rose-500/15' },
} as const;

/**
 * Shows the final outcome of an already-resolved transfer (COMPLETED/
 * CANCELLED/FAILED). The transfer itself is resolved immediately after
 * voice verification passes (see TransferPage), so there's no pending/
 * countdown state to render here anymore.
 */
export function TransferCountdown({ transaction }: { transaction: WalletTransaction }) {
  const navigate = useNavigate();

  const recipientName = transaction.recipientSnapshot?.name ?? transaction.recipientIban ?? 'recipient';
  const config = RESOLVED_CONFIG[transaction.status as keyof typeof RESOLVED_CONFIG];
  const Icon = config?.icon ?? CheckCircle2;

  return (
    <div className="glass-card animate-fade-in-up p-8 text-center">
      <div className="flex flex-col items-center">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${config?.classes ?? ''}`}>
          <Icon size={30} />
        </span>
        <div className="mt-4">
          <StatusBadge status={transaction.status} />
        </div>
        <p className="mx-auto mt-3 max-w-xs text-sm text-gray-500 dark:text-gray-400">
          {transaction.status === 'COMPLETED' &&
            `Sent ${Number(transaction.amount).toFixed(2)} ${transaction.currency} to ${recipientName}.`}
          {transaction.status === 'CANCELLED' && 'Transfer cancelled — funds returned to your wallet.'}
          {transaction.status === 'FAILED' &&
            (transaction.failureReason ?? 'Transfer failed — funds returned to your wallet.')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99]"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
