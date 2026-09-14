import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { listTransactions } from '../api/transactions';
import { TransactionList } from '../components/wallet/TransactionList';
import type { TransactionStatus, TransactionType } from '../types/api';

const TYPE_OPTIONS: Array<{ label: string; value: TransactionType | '' }> = [
  { label: 'All types', value: '' },
  { label: 'Top ups', value: 'TOPUP' },
  { label: 'Sent', value: 'TRANSFER_OUT' },
  { label: 'Received', value: 'TRANSFER_IN' },
];

const STATUS_OPTIONS: Array<{ label: string; value: TransactionStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Failed', value: 'FAILED' },
];

const PAGE_SIZE = 20;

function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-300'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function TransactionHistoryPage() {
  const [type, setType] = useState<TransactionType | ''>('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['transactions', { type, status, page, pageSize: PAGE_SIZE }],
    queryFn: () =>
      listTransactions({
        type: type || undefined,
        status: status || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / PAGE_SIZE)) : 1;

  return (
    <div className="animate-fade-in-up">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Transaction history</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Every top-up and transfer, logged.</p>

      <div className="mb-4 space-y-2.5">
        <FilterChips
          options={TYPE_OPTIONS}
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
        />
        <FilterChips
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
      </div>

      <div className="glass-card p-3 sm:p-5">
        {query.isLoading && (
          <div className="flex justify-center py-10 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}
        {query.data && <TransactionList transactions={query.data.items} />}
      </div>

      {query.data && totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
