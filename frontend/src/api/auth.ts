import { apiClient } from './client';
import type { User } from '../types/api';

export async function signup(data: { email: string; password: string; fullName: string; phone?: string }) {
  const res = await apiClient.post<{ accessToken: string }>('/auth/signup', data);
  return res.data;
}

export async function login(data: { email: string; password: string }) {
  const res = await apiClient.post<{ accessToken: string }>('/auth/login', data);
  return res.data;
}

export async function fetchMe() {
  const res = await apiClient.get<User>('/auth/me');
  return res.data;
}
