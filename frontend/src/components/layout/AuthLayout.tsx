import type { ReactNode } from 'react';
import { ShieldCheck, Timer, UserCheck, WalletMinimal } from 'lucide-react';

const FEATURES = [
  {
    icon: Timer,
    title: '60-second safety hold',
    body: 'Every transfer waits 60 seconds before it settles — cancel anytime and get an instant refund.',
  },
  {
    icon: UserCheck,
    title: 'Know who you’re paying',
    body: 'We show the recipient’s name and bank details clearly before you confirm.',
  },
  {
    icon: ShieldCheck,
    title: 'Bank-linked & verified',
    body: 'Connect your real bank account and move money with confidence.',
  },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-linear-to-br from-brand-600 via-brand-500 to-violet-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0, transparent 35%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)',
          }}
        />

        <div className="relative flex items-center gap-2 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <WalletMinimal size={20} />
          </span>
          ZWallet
        </div>

        <div className="relative space-y-8">
          <h1 className="text-3xl font-bold leading-tight text-balance">
            Send money with confidence, every single time.
          </h1>
          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/75">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">Connected to JoPACC Open Banking sandbox</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-6">{children}</div>
    </div>
  );
}
