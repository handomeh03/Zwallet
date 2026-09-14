import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Inbox, Loader2 } from 'lucide-react';
import { listAllTransactions } from '../api/admin';
import { TransactionRow } from '../components/wallet/TransactionRow';
import type { TransactionStatus, TransactionType } from '../types/api';

const TYPE_OPTIONS: TransactionType[] = ['TOPUP', 'TRANSFER_OUT', 'TRANSFER_IN'];
const STATUS_OPTIONS: TransactionStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminTransactionsPage() {
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [type, setType] = useState<TransactionType | ''>('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');

  const query = useQuery({
    queryKey: ['admin-transactions', { from, to, type, status }],
    queryFn: () =>
      listAllTransactions({
        from: from || undefined,
        to: to || undefined,
        type: type || undefined,
        status: status || undefined,
        pageSize: 100,
      }),
  });

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">All transactions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Every wallet operation across ZWallet.</p>
      </div>

      <div className="glass-card flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType | '')}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="">All</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TransactionStatus | '')}
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

      <div className="glass-card p-4">
        {query.isLoading && (
          <div className="flex justify-center py-10 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}

        {query.data && query.data.items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
            <Inbox size={28} strokeWidth={1.5} />
            <p className="text-sm">No transactions in this range</p>
          </div>
        )}

        {query.data && query.data.items.length > 0 && (
          <div className="flex flex-col gap-1">
            {query.data.items.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} ownerLabel={tx.owner.fullName} />
            ))}
          </div>
        )}

        {query.data && (
          <p className="mt-3 text-xs text-gray-400">
            Showing {query.data.items.length} of {query.data.total}
          </p>
        )}
      </div>
    </div>
  );
}
