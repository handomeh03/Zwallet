import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Coins, Inbox, Loader2 } from 'lucide-react';
import { getAdminCommissions } from '../api/admin';

function firstDayOfMonthIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminCommissionsPage() {
  const [from, setFrom] = useState(firstDayOfMonthIso());
  const [to, setTo] = useState(todayIso());

  const query = useQuery({
    queryKey: ['admin-commissions', { from, to }],
    queryFn: () => getAdminCommissions({ from: from || undefined, to: to || undefined }),
  });

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Commissions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Fees collected from external (IBAN) transfers, by date range.
        </p>
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
      </div>

      {query.isLoading && (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}

      {query.data && (
        <>
          <div className="glass-card flex items-center gap-4 border-brand-200 bg-brand-50/60 p-6 dark:border-brand-500/20 dark:bg-brand-500/10">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30">
              <Coins size={22} />
            </span>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number(query.data.totalCommission).toFixed(2)} JOD
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                From {query.data.transactionCount} external transfer{query.data.transactionCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="glass-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Daily breakdown</h2>
            {query.data.byDay.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
                <Inbox size={28} strokeWidth={1.5} />
                <p className="text-sm">No commission in this range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-400 dark:border-white/10">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Transfers</th>
                      <th className="pb-2 text-right font-medium">Commission (JOD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.byDay.map((row) => (
                      <tr key={row.date} className="border-b border-gray-100 last:border-0 dark:border-white/5">
                        <td className="py-2 text-gray-900 dark:text-white">{row.date}</td>
                        <td className="py-2 text-gray-500 dark:text-gray-400">{row.count}</td>
                        <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {row.commission.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
