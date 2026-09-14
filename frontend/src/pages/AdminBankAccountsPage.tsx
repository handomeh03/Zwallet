import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Landmark, Loader2, Lock, Search } from 'lucide-react';
import { listAllBankAccounts } from '../api/admin';
import type { BankAccountStatus } from '../types/api';

const STATUS_OPTIONS: BankAccountStatus[] = ['ACTIVE', 'SUSPENDED', 'CLOSED'];

export function AdminBankAccountsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BankAccountStatus | ''>('');
  const query = useQuery({ queryKey: ['admin-accounts'], queryFn: listAllBankAccounts });

  const filtered = useMemo(() => {
    if (!query.data) return [];
    const term = search.trim().toLowerCase();
    return query.data.filter((account) => {
      const matchesSearch =
        !term ||
        account.user.fullName.toLowerCase().includes(term) ||
        account.user.email.toLowerCase().includes(term) ||
        account.iban.toLowerCase().includes(term);
      const matchesStatus = !status || account.accountStatus === status;
      return matchesSearch && matchesStatus;
    });
  }, [query.data, search, status]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">All bank accounts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Every linked bank account across ZWallet.</p>
      </div>

      <div className="glass-card flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-48 flex-1">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Search (name, email, IBAN)
          </label>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Sara or JO27..."
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BankAccountStatus | '')}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.isLoading && (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}

      {query.data && (
        <>
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {query.data.length}
          </p>
          <ul className="space-y-3">
          {filtered.map((account) => (
            <li key={account.id} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <Landmark size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {account.user.fullName} <span className="font-normal text-gray-400">({account.user.email})</span>
                  </p>
                  <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{account.iban}</p>
                  <p className="text-xs text-gray-400">{account.institutionName ?? '—'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    account.accountStatus === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                  }`}
                >
                  {account.accountStatus}
                </span>
                {(account.lockedForCredit || account.lockedForDebit) && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <Lock size={11} />
                    {account.lockedForCredit && account.lockedForDebit
                      ? 'Locked (credit+debit)'
                      : account.lockedForCredit
                        ? 'Locked (credit)'
                        : 'Locked (debit)'}
                  </span>
                )}
              </div>
            </li>
          ))}
          </ul>
        </>
      )}
    </div>
  );
}
