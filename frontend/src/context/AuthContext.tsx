import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, login as loginRequest, signup as signupRequest } from '../api/auth';
import { getStoredToken, setStoredToken } from '../api/client';
import type { User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setStoredToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await loginRequest({ email, password });
    setStoredToken(accessToken);
    await refreshUser();
  }, [refreshUser]);

  const signup = useCallback(
    async (data: { email: string; password: string; fullName: string; phone?: string }) => {
      const { accessToken } = await signupRequest(data);
      setStoredToken(accessToken);
      await refreshUser();
    },
    [refreshUser],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
