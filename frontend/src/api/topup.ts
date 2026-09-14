import { apiClient } from './client';
import type { WalletTransaction } from '../types/api';

export async function topUp(data: { linkedBankAccountId: string; amount: number }) {
  const res = await apiClient.post<WalletTransaction>('/topup', data);
  return res.data;
}
