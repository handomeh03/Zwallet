import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { confirmTransferNow, createTransfer } from '../api/transfers';
import { extractErrorMessage } from '../api/client';
import { RecipientPicker } from '../components/transfer/RecipientPicker';
import { RecipientConfirmCard } from '../components/transfer/RecipientConfirmCard';
import { VoiceNameVerification } from '../components/transfer/VoiceNameVerification';
import { TransferCountdown } from '../components/transfer/TransferCountdown';
import { ErrorBanner } from '../components/common/ErrorBanner';
import type { RecipientResolution, WalletTransaction } from '../types/api';

const STEPS = ['Recipient', 'Amount', 'Verify'];

export function TransferPage() {
  const [recipient, setRecipient] = useState<RecipientResolution | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const created = await createTransfer({
        recipientType: recipient!.recipientType,
        recipientUserId: recipient?.recipientUserId,
        recipientIban: recipient?.recipientIban,
        amount: pendingAmount!,
      });
      return confirmTransferNow(created.id);
    },
    onSuccess: (tx) => setTransaction(tx),
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const activeStep = transaction ? 2 : pendingAmount !== null ? 2 : recipient ? 1 : 0;

  return (
    <div className="animate-fade-in-up mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Send money</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        We'll read the recipient's name aloud — confirm it's really them before it sends.
      </p>

      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= activeStep
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                i <= activeStep ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 ${i < activeStep ? 'bg-brand-500' : 'bg-gray-200 dark:bg-white/10'}`}
              />
            )}
          </div>
        ))}
      </div>

      {!recipient && <RecipientPicker onResolved={setRecipient} />}

      {recipient && pendingAmount === null && !transaction && (
        <RecipientConfirmCard
          recipient={recipient}
          onBack={() => {
            setRecipient(null);
            setError(null);
          }}
          onConfirm={(amount) => {
            setError(null);
            setPendingAmount(amount);
          }}
          isSubmitting={false}
        />
      )}

      {recipient && pendingAmount !== null && !transaction && (
        <>
          <ErrorBanner message={error} />
          <VoiceNameVerification name={recipient.snapshot.name} onVerifiedChange={setVerified} />

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setPendingAmount(null);
                setVerified(false);
                setError(null);
              }}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!verified || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sendMutation.isPending ? 'Sending…' : 'Confirm & Send'}
            </button>
          </div>
        </>
      )}

      {transaction && <TransferCountdown transaction={transaction} />}
    </div>
  );
}
