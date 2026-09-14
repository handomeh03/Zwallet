import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Loader2, PlusCircle, Settings2, Wallet } from 'lucide-react';
import { listBankAccounts } from '../../api/bankAccounts';
import { topUp } from '../../api/topup';
import { extractErrorMessage } from '../../api/client';
import { ErrorBanner } from '../common/ErrorBanner';
import { SuccessBanner } from '../common/SuccessBanner';
import { useAuth } from '../../hooks/useAuth';

const QUICK_AMOUNTS = [10, 25, 50, 100];

export function TopUpForm() {
  const { refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const accountsQuery = useQuery({ queryKey: ['bank-accounts'], queryFn: listBankAccounts });
  const accounts = accountsQuery.data ?? [];
  const defaultAccount = accounts.find((a) => a.isPrimary) ?? accounts[0] ?? null;
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? defaultAccount;

  const mutation = useMutation({
    mutationFn: () => topUp({ linkedBankAccountId: selectedAccount!.id, amount: Number(amount) }),
    onSuccess: async (tx) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (tx.status === 'COMPLETED') {
        setSuccess(`Successfully topped up ${amount} JOD`);
        setTimeout(() => navigate('/'), 1200);
      } else {
        setError(tx.failureReason ?? 'Top up failed: insufficient funds in your bank account');
      }
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    mutation.mutate();
  }

  if (accountsQuery.isLoading) {
    return (
      <div className="flex justify-center py-10 text-gray-400">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 p-8 text-center">
        <Landmark size={28} className="text-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Link a bank account first to top up your wallet.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="mb-5 flex justify-end">
        <Link
          to="/accounts"
          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          <Settings2 size={13} />
          Manage bank accounts
        </Link>
      </div>

      {accounts.length > 1 ? (
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">From account</label>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedAccountId(account.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                  selectedAccount.id === account.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5'
                }`}
              >
                <Landmark size={16} className="shrink-0" />
                <span className="flex flex-col">
                  <span className="font-medium">{account.label || account.institutionName || 'Bank account'}</span>
                  <span className="font-mono text-xs opacity-75">{account.iban}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
          <Landmark size={16} />
          From <span className="font-mono text-xs">{selectedAccount.iban}</span>
        </div>
      )}

      <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Amount (JOD)</label>
      <div className="relative mb-3">
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

      <div className="mb-5 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(String(value))}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              amount === String(value)
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-300'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5'
            }`}
          >
            {value} JOD
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
        {mutation.isPending ? 'Checking funds...' : 'Charge'}
      </button>
    </form>
  );
}
