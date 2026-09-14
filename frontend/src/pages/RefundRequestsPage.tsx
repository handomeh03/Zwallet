import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { approveRefundRequest, createRefundRequest, listRefundRequests, rejectRefundRequest } from '../api/refunds';
import { extractErrorMessage } from '../api/client';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { SuccessBanner } from '../components/common/SuccessBanner';
import type { RefundRequest, RefundRequestStatus } from '../types/api';

const STATUS_STYLES: Record<RefundRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  REJECTED: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

function RefundStatusBadge({ status }: { status: RefundRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function NewRefundRequestForm() {
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createRefundRequest({ targetIdentifier, amount: Number(amount), reason }),
    onSuccess: () => {
      setSuccess('Refund request sent.');
      setTargetIdentifier('');
      setAmount('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Request a refund</h2>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
        Who received the money? (email or phone)
      </label>
      <input
        type="text"
        value={targetIdentifier}
        onChange={(e) => setTargetIdentifier(e.target.value)}
        required
        placeholder="name@example.com"
        className="mb-4 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />

      <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Amount (JOD)</label>
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        placeholder="0.00"
        className="mb-4 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />

      <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
        What happened?
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
        minLength={5}
        rows={3}
        placeholder="e.g. I sent this by mistake to the wrong person via my bank app on..."
        className="mb-5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
        {mutation.isPending ? 'Sending...' : 'Send refund request'}
      </button>
    </form>
  );
}

function RefundRequestRow({ request, mode }: { request: RefundRequest; mode: 'sent' | 'received' }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: () => approveRefundRequest(request.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['refund-requests'] }),
    onError: (err) => setError(extractErrorMessage(err)),
  });
  const rejectMutation = useMutation({
    mutationFn: () => rejectRefundRequest(request.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['refund-requests'] }),
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const counterpart = mode === 'sent' ? request.target : request.requester;
  const isBusy = approveMutation.isPending || rejectMutation.isPending;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 dark:border-white/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {mode === 'sent' ? 'To' : 'From'} {counterpart?.fullName ?? 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{request.amount} {request.currency}</p>
        </div>
        <RefundStatusBadge status={request.status} />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{request.reason}</p>
      {request.failureReason && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{request.failureReason}</p>
      )}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      {mode === 'received' && request.status === 'PENDING' && (
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => approveMutation.mutate()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {approveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Approve
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => rejectMutation.mutate()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {rejectMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Reject
          </button>
        </div>
      )}
    </li>
  );
}

export function RefundRequestsPage() {
  const query = useQuery({ queryKey: ['refund-requests'], queryFn: listRefundRequests });

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Refund requests</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sent money to the wrong person? Ask them to send it back — even if the original transfer wasn't
          through ZWallet.
        </p>
      </div>

      <NewRefundRequestForm />

      {query.isLoading && (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}

      {query.data && (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Received</h2>
            {query.data.received.length === 0 ? (
              <p className="text-sm text-gray-400">No refund requests received.</p>
            ) : (
              <ul className="space-y-3">
                {query.data.received.map((r) => (
                  <RefundRequestRow key={r.id} request={r} mode="received" />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Sent</h2>
            {query.data.sent.length === 0 ? (
              <p className="text-sm text-gray-400">No refund requests sent.</p>
            ) : (
              <ul className="space-y-3">
                {query.data.sent.map((r) => (
                  <RefundRequestRow key={r.id} request={r} mode="sent" />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
