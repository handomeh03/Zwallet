import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, Landmark, Loader2, PlusCircle, Star, Trash2 } from 'lucide-react';
import { listBankAccounts, setPrimaryBankAccount, unlinkBankAccount } from '../api/bankAccounts';
import { extractErrorMessage } from '../api/client';
import { ErrorBanner } from '../components/common/ErrorBanner';
import type { LinkedBankAccount } from '../types/api';

function BankAccountRow({ account }: { account: LinkedBankAccount }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const primaryMutation = useMutation({
    mutationFn: () => setPrimaryBankAccount(account.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }),
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkBankAccount(account.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }),
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function handleUnlink() {
    setError(null);
    if (window.confirm(`Unlink ${account.iban}? You can re-link it later if needed.`)) {
      unlinkMutation.mutate();
    }
  }

  return (
    <li className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <Landmark size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {account.label || account.institutionName || 'Bank account'}
          </p>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{account.iban}</p>
          {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        {account.isPrimary ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle2 size={14} />
            Used for top-up
          </span>
        ) : (
          <button
            type="button"
            disabled={primaryMutation.isPending}
            onClick={() => primaryMutation.mutate()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {primaryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
            Use for top-up
          </button>
        )}
        <button
          type="button"
          disabled={unlinkMutation.isPending}
          onClick={handleUnlink}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
        >
          {unlinkMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Unlink
        </button>
      </div>
    </li>
  );
}

export function BankAccountsPage() {
  const query = useQuery({ queryKey: ['bank-accounts'], queryFn: listBankAccounts });

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Your bank accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pick which account gets charged when you top up your wallet.
          </p>
        </div>
        <Link
          to="/accounts/link"
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99]"
        >
          <PlusCircle size={16} />
          Add account
        </Link>
      </div>

      {query.isLoading && (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}

      {query.data && query.data.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 p-8 text-center">
          <Landmark size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500 dark:text-gray-400">You haven't linked any bank accounts yet.</p>
        </div>
      )}

      {query.data && query.data.length > 0 && (
        <ul className="space-y-3">
          {query.data.map((account) => (
            <BankAccountRow key={account.id} account={account} />
          ))}
        </ul>
      )}
    </div>
  );
}
