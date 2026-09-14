import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Send,
  History,
  LogOut,
  WalletMinimal,
  RotateCcw,
  Landmark,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const CUSTOMER_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/topup', label: 'Top Up', icon: PlusCircle, end: false },
  { to: '/transfer', label: 'Send', icon: Send, end: false },
  { to: '/transactions', label: 'History', icon: History, end: false },
  { to: '/refund-requests', label: 'Refunds', icon: RotateCcw, end: false },
  { to: '/accounts', label: 'Bank Accounts', icon: Landmark, end: false },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: ShieldCheck, end: true },
  { to: '/admin/transactions', label: 'Transactions', icon: History, end: false },
  { to: '/admin/commissions', label: 'Commissions', icon: Coins, end: false },
  { to: '/admin/accounts', label: 'Bank Accounts', icon: Landmark, end: false },
];

export function NavBar() {
  const { user, logout } = useAuth();

  const initials = user?.fullName
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-[#0b0c14]/80">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-brand-400 to-brand-600 text-white shadow-md shadow-brand-500/30">
            <WalletMinimal size={18} strokeWidth={2.25} />
          </span>
          <span className="text-lg">ZWallet</span>
        </div>

        <nav className="scrollbar-none ml-2 flex flex-1 items-center gap-1 overflow-x-auto">
          {(user?.role === 'ADMIN' ? ADMIN_NAV_ITEMS : CUSTOMER_NAV_ITEMS).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="max-w-36 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.fullName}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
