import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Landmark, Link2, Loader2, Tag } from 'lucide-react';
import { linkBankAccount } from '../../api/bankAccounts';
import { extractErrorMessage } from '../../api/client';
import { ErrorBanner } from '../common/ErrorBanner';
import { TextField } from '../common/TextField';

export function LinkAccountForm() {
  const [accountAddress, setAccountAddress] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => linkBankAccount({ accountAddress: accountAddress.trim(), label: label.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      navigate('/');
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <ErrorBanner message={error} />

      <TextField
        label="IBAN or account ID"
        icon={<Landmark size={16} />}
        value={accountAddress}
        onChange={(e) => setAccountAddress(e.target.value)}
        placeholder="e.g. JO27CBJO0000000000000000001001"
        required
      />
      <TextField
        label="Label (optional)"
        icon={<Tag size={16} />}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. My salary account"
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
        {mutation.isPending ? 'Linking...' : 'Link account'}
      </button>
    </form>
  );
}
