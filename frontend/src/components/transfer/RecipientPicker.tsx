import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Landmark, Loader2, Search, UserRound } from 'lucide-react';
import { resolveRecipient } from '../../api/transfers';
import { extractErrorMessage } from '../../api/client';
import { ErrorBanner } from '../common/ErrorBanner';
import { TextField } from '../common/TextField';
import type { RecipientResolution } from '../../types/api';

export function RecipientPicker({ onResolved }: { onResolved: (result: RecipientResolution) => void }) {
  const [tab, setTab] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => resolveRecipient({ type: tab, identifierOrIban: identifier.trim() }),
    onSuccess: (result) => onResolved(result),
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
        {(
          [
            { key: 'INTERNAL', label: 'ZWallet user', icon: UserRound },
            { key: 'EXTERNAL', label: 'Bank IBAN', icon: Landmark },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setIdentifier('');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? 'bg-white text-brand-700 shadow-sm dark:bg-white/10 dark:text-brand-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} />

      <TextField
        label={tab === 'INTERNAL' ? 'Recipient email or phone' : 'Recipient IBAN'}
        icon={tab === 'INTERNAL' ? <UserRound size={16} /> : <Landmark size={16} />}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder={tab === 'INTERNAL' ? 'name@example.com' : 'JO27CBJO0000000000000000001001'}
        required
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        {mutation.isPending ? 'Looking up...' : 'Find recipient'}
      </button>
    </form>
  );
}
