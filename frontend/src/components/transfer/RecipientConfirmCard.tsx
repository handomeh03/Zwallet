import { useState, type FormEvent } from 'react';
import { ArrowLeft, BadgeCheck, Loader2, Send, Wallet } from 'lucide-react';
import type { RecipientResolution } from '../../types/api';

// Mirrors EXTERNAL_TRANSFER_FEE in backend/src/transfers/transfers.service.ts —
// only external (IBAN) transfers carry this fee, charged on top of the amount.
const EXTERNAL_TRANSFER_FEE = 0.1;

export function RecipientConfirmCard({
  recipient,
  onBack,
  onConfirm,
  isSubmitting,
}: {
  recipient: RecipientResolution;
  onBack: () => void;
  onConfirm: (amount: number) => void;
  isSubmitting: boolean;
}) {
  const [amount, setAmount] = useState('');
  const isExternal = recipient.recipientType === 'EXTERNAL_IBAN';
  const parsedAmount = Number(amount);
  const hasValidAmount = amount !== '' && !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const total = hasValidAmount ? parsedAmount + EXTERNAL_TRANSFER_FEE : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onConfirm(Number(amount));
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card animate-fade-in-up p-6">
      <div className="mb-6 flex items-center gap-4 rounded-xl bg-gray-50 p-4 dark:bg-white/5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">
          {recipient.snapshot.avatarUrl ? (
            <img src={recipient.snapshot.avatarUrl} alt={recipient.snapshot.name} className="h-full w-full object-cover" />
          ) : (
            <span>{recipient.snapshot.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-lg font-bold text-gray-900 dark:text-white">{recipient.snapshot.name}</p>
            <BadgeCheck size={16} className="shrink-0 text-brand-500" />
          </div>
          {recipient.recipientType === 'EXTERNAL_IBAN' && (
            <>
              <p className="truncate font-mono text-xs text-gray-400">{recipient.recipientIban}</p>
              {recipient.snapshot.institutionName && (
                <p className="truncate text-xs text-gray-400">{recipient.snapshot.institutionName}</p>
              )}
            </>
          )}
          {recipient.recipientType === 'INTERNAL_USER' && (
            <p className="text-xs text-gray-400">ZWallet user</p>
          )}
        </div>
      </div>

      <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Amount (JOD)</label>
      <div className="relative mb-5">
        <Wallet size={18} className="pointer-events-none absolute inset-y-0 left-3.5 my-auto text-gray-400" />
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="0.00"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-2xl font-bold text-gray-900 shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      </div>

      {isExternal && hasValidAmount && (
        <div className="mb-5 space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm dark:bg-white/5">
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Amount</span>
            <span>{parsedAmount.toFixed(2)} JOD</span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Transfer fee</span>
            <span>{EXTERNAL_TRANSFER_FEE.toFixed(2)} JOD</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-gray-900 dark:border-white/10 dark:text-white">
            <span>Total charged</span>
            <span>{total!.toFixed(2)} JOD</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {isSubmitting ? 'Starting transfer...' : 'Transfer'}
        </button>
      </div>
    </form>
  );
}
