import { apiClient } from './client';
import type { RefundRequest, RefundRequestsResponse } from '../types/api';

export async function createRefundRequest(data: {
  targetIdentifier: string;
  amount: number;
  reason: string;
  originalTransactionId?: string;
}) {
  const res = await apiClient.post<RefundRequest>('/refund-requests', data);
  return res.data;
}

export async function listRefundRequests() {
  const res = await apiClient.get<RefundRequestsResponse>('/refund-requests');
  return res.data;
}

export async function approveRefundRequest(id: string) {
  const res = await apiClient.post<RefundRequest>(`/refund-requests/${id}/approve`);
  return res.data;
}

export async function rejectRefundRequest(id: string) {
  const res = await apiClient.post<RefundRequest>(`/refund-requests/${id}/reject`);
  return res.data;
}
