import { apiClient } from './client';
import type {
  AdminBankAccount,
  AdminCommissionsResponse,
  AdminOverview,
  AdminTransactionListResponse,
  TransactionStatus,
  TransactionType,
} from '../types/api';

export async function getAdminOverview() {
  const res = await apiClient.get<AdminOverview>('/admin/overview');
  return res.data;
}

export async function listAllBankAccounts() {
  const res = await apiClient.get<AdminBankAccount[]>('/admin/accounts');
  return res.data;
}

export async function getAdminCommissions(filters: { from?: string; to?: string }) {
  const res = await apiClient.get<AdminCommissionsResponse>('/admin/commissions', { params: filters });
  return res.data;
}

export async function listAllTransactions(filters: {
  type?: TransactionType;
  status?: TransactionStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await apiClient.get<AdminTransactionListResponse>('/admin/transactions', {
    params: filters,
  });
  return res.data;
}
