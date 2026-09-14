import { apiClient } from './client';
import type { TransactionListResponse, TransactionStatus, TransactionType } from '../types/api';

export async function listTransactions(params: {
  type?: TransactionType;
  status?: TransactionStatus;
  page?: number;
  pageSize?: number;
}) {
  const res = await apiClient.get<TransactionListResponse>('/transactions', { params });
  return res.data;
}
