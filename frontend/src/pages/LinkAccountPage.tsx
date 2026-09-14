import { CheckCircle2, Landmark } from 'lucide-react';
import { LinkAccountForm } from '../components/accounts/LinkAccountForm';

const BENEFITS = [
  'See your bank balance right next to your wallet balance',
  'Top up instantly with real-time funds confirmation',
  'Only active accounts can be linked — we check for you',
];

export function LinkAccountPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-md">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30">
          <Landmark size={26} />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Link your bank account</h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Connect your bank account once — no need to re-enter it every time.
        </p>
      </div>

      <ul className="mb-6 space-y-2.5">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-500" />
            {benefit}
          </li>
        ))}
      </ul>

      <LinkAccountForm />
    </div>
  );
}
