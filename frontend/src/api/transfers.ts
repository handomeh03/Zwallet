import { apiClient } from './client';
import type { RecipientResolution, WalletTransaction } from '../types/api';

export async function resolveRecipient(data: { type: 'INTERNAL' | 'EXTERNAL'; identifierOrIban: string }) {
  const res = await apiClient.post<RecipientResolution>('/transfers/resolve-recipient', data);
  return res.data;
}

export async function createTransfer(data: {
  recipientType: 'INTERNAL_USER' | 'EXTERNAL_IBAN';
  recipientUserId?: string;
  recipientIban?: string;
  amount: number;
}) {
  const res = await apiClient.post<WalletTransaction>('/transfers', data);
  return res.data;
}

export async function cancelTransfer(id: string) {
  const res = await apiClient.post<WalletTransaction>(`/transfers/${id}/cancel`);
  return res.data;
}

export async function confirmTransferNow(id: string) {
  const res = await apiClient.post<WalletTransaction>(`/transfers/${id}/confirm-now`);
  return res.data;
}

export async function getTransfer(id: string) {
  const res = await apiClient.get<WalletTransaction>(`/transfers/${id}`);
  return res.data;
}
