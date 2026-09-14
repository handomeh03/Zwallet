import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, PlusCircle, Send } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { listBankAccounts } from '../api/bankAccounts';
import { listTransactions } from '../api/transactions';
import { BalanceCard } from '../components/wallet/BalanceCard';
import { StatsRow } from '../components/wallet/StatsRow';
import { TransactionList } from '../components/wallet/TransactionList';

export function DashboardPage() {
  const { user } = useAuth();

  const accountsQuery = useQuery({ queryKey: ['bank-accounts'], queryFn: listBankAccounts });
  const transactionsQuery = useQuery({
    queryKey: ['transactions', { page: 1, pageSize: 50 }],
    queryFn: () => listTransactions({ page: 1, pageSize: 50 }),
  });

  if (!user) return null;

  const items = transactionsQuery.data?.items ?? [];

  return (
    <div className="animate-fade-in-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user.fullName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Here's what's happening with your wallet.</p>
      </div>

      <BalanceCard user={user} linkedAccounts={accountsQuery.data ?? []} />

      <div className="flex flex-wrap gap-3">
        <Link
          to="/topup"
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99]"
        >
          <PlusCircle size={16} />
          Top up
        </Link>
        <Link
          to="/transfer"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
        >
          <Send size={16} />
          Send money
        </Link>
      </div>

      {transactionsQuery.data && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">This period</h2>
          <StatsRow transactions={items} />
        </section>
      )}

      <section className="glass-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent activity</h2>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>
        {transactionsQuery.isLoading && (
          <div className="flex justify-center py-10 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}
        {transactionsQuery.data && <TransactionList transactions={items.slice(0, 5)} />}
      </section>
    </div>
  );
}
