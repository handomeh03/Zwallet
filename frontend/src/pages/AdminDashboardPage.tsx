import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Coins, History, Landmark, Loader2, Users, Wallet } from 'lucide-react';
import { getAdminOverview } from '../api/admin';

export function AdminDashboardPage() {
  const query = useQuery({ queryKey: ['admin-overview'], queryFn: getAdminOverview });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-10 text-gray-400">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  const overview = query.data;
  if (!overview) return null;

  const stats = [
    { label: 'Total users', value: overview.userCount, icon: Users },
    { label: 'Wallet funds (JOD)', value: Number(overview.totalWalletBalance).toFixed(2), icon: Wallet },
    { label: 'Held funds (JOD)', value: Number(overview.totalHeldBalance).toFixed(2), icon: Wallet },
    { label: 'Linked accounts', value: overview.linkedAccountCount, icon: Landmark },
    { label: "Today's transactions", value: overview.todaysTransactionCount, icon: History },
  ];

  return (
    <div className="animate-fade-in-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          A view across every wallet, account, and transaction in ZWallet.
        </p>
      </div>

      <div className="glass-card flex items-center gap-4 border-brand-200 bg-brand-50/60 p-6 dark:border-brand-500/20 dark:bg-brand-500/10">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30">
          <Coins size={22} />
        </span>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Number(overview.todaysCommission).toFixed(2)} JOD
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Today's commission (external transfer fees)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-card p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
              <Icon size={16} strokeWidth={2.25} />
            </span>
            <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/transactions"
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99]"
        >
          <History size={16} />
          All transactions
        </Link>
        <Link
          to="/admin/accounts"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
        >
          <Landmark size={16} />
          All bank accounts
        </Link>
      </div>
    </div>
  );
}
