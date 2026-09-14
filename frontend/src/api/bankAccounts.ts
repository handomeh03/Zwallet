import { apiClient } from './client';
import type { LinkedBankAccount } from '../types/api';

export async function linkBankAccount(data: { accountAddress: string; label?: string }) {
  const res = await apiClient.post<LinkedBankAccount>('/bank-accounts/link', data);
  return res.data;
}

export async function listBankAccounts() {
  const res = await apiClient.get<LinkedBankAccount[]>('/bank-accounts');
  return res.data;
}

export async function setPrimaryBankAccount(id: string) {
  const res = await apiClient.post<LinkedBankAccount[]>(`/bank-accounts/${id}/set-primary`);
  return res.data;
}

export async function unlinkBankAccount(id: string) {
  const res = await apiClient.delete<LinkedBankAccount[]>(`/bank-accounts/${id}`);
  return res.data;
}
