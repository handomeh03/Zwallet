import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Landmark, Link2, Loader2, WalletMinimal } from 'lucide-react';
import { getBankBalance } from '../../api/balances';
import type { LinkedBankAccount, User } from '../../types/api';

function LinkedAccountBalanceRow({ account }: { account: LinkedBankAccount }) {
  const balanceQuery = useQuery({
    queryKey: ['bank-balance', account.id],
    queryFn: () => getBankBalance(account.id),
    staleTime: 60_000,
  });

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-white/5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {account.label || account.institutionName || 'Bank account'}
        </p>
        <p className="truncate font-mono text-xs text-gray-400">{account.iban}</p>
      </div>
      <div className="shrink-0 text-right">
        {balanceQuery.isLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
        {balanceQuery.isError && <span className="text-xs text-gray-400">Unavailable</span>}
        {balanceQuery.data && (
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {balanceQuery.data.availableBalance.balanceAmount.toFixed(2)}{' '}
            <span className="font-medium text-gray-400">{balanceQuery.data.balanceCurrency}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function BalanceCard({
  user,
  linkedAccounts,
}: {
  user: User;
  linkedAccounts: LinkedBankAccount[];
}) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-500 via-brand-600 to-violet-700 p-5 text-white shadow-lg shadow-brand-500/25">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="relative flex items-center gap-2 text-sm font-medium text-white/80">
          <WalletMinimal size={16} />
          Wallet balance
        </div>
        <div className="relative mt-2 text-2xl font-bold tracking-tight">
          {Number(user.walletBalance).toFixed(2)} <span className="text-base font-semibold text-white/70">JOD</span>
        </div>
        {Number(user.heldBalance) > 0 && (
          <div className="relative mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
            {Number(user.heldBalance).toFixed(2)} JOD held in pending transfers
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <Landmark size={16} />
            Linked bank accounts
          </div>
          {linkedAccounts.length > 0 && (
            <Link
              to="/accounts"
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Manage
            </Link>
          )}
        </div>

        {linkedAccounts.length === 0 && (
          <div className="mt-3">
            <p className="text-xl font-semibold text-gray-400 dark:text-gray-500">Not linked</p>
            <Link
              to="/accounts/link"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
            >
              <Link2 size={14} />
              Link a bank account
            </Link>
          </div>
        )}

        {linkedAccounts.length > 0 && (
          <div className="mt-2 max-h-56 overflow-y-auto">
            {linkedAccounts.map((account) => (
              <LinkedAccountBalanceRow key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
