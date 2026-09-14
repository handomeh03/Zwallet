import { apiClient } from './client';
import type { BankBalance } from '../types/api';

export async function getBankBalance(linkedBankAccountId: string) {
  const res = await apiClient.get<BankBalance>(`/bank-accounts/${linkedBankAccountId}/balance`);
  return res.data;
}
