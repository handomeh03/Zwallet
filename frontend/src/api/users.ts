import { apiClient } from './client';
import type { UserSearchResult } from '../types/api';

export async function searchUsers(query: string) {
  const res = await apiClient.get<UserSearchResult[]>('/users/search', { params: { q: query } });
  return res.data;
}
