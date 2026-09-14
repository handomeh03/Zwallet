import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTransfer } from '../api/transfers';
import type { WalletTransaction } from '../types/api';

export function useTransferCountdown(transaction: WalletTransaction) {
  const [remainingMs, setRemainingMs] = useState(() => computeRemaining(transaction));

  const query = useQuery({
    queryKey: ['transfer', transaction.id],
    queryFn: () => getTransfer(transaction.id),
    initialData: transaction,
    refetchInterval: (q) => (q.state.data?.status === 'PENDING' ? 3000 : false),
  });

  const current = query.data ?? transaction;

  useEffect(() => {
    if (current.status !== 'PENDING') {
      setRemainingMs(0);
      return;
    }
    const interval = setInterval(() => {
      setRemainingMs(computeRemaining(current));
    }, 250);
    return () => clearInterval(interval);
  }, [current]);

  return {
    transaction: current,
    remainingSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
    isPending: current.status === 'PENDING',
  };
}

function computeRemaining(transaction: WalletTransaction): number {
  if (!transaction.pendingExpiresAt) return 0;
  return new Date(transaction.pendingExpiresAt).getTime() - Date.now();
}
