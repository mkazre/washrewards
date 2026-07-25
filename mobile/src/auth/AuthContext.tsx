import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '../config';
import * as api from '../api/endpoints';
import { AppUser } from '../api/types';

interface AuthState {
  booting: boolean;
  token: string | null;
  user: AppUser | null;
  isPartner: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (b: { name: string; email: string; phone?: string; password: string; password_confirmation: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          const u = await api.me(saved);
          setToken(saved);
          setUser(u);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const persist = useCallback(async (t: string, u: AppUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    await persist(res.token, res.user);
  }, [persist]);

  const signUp = useCallback<AuthState['signUp']>(async (b) => {
    const res = await api.register(b);
    await persist(res.token, res.user);
  }, [persist]);

  const signOut = useCallback(async () => {
    try { if (token) await api.logout(token); } catch { /* ignore */ }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try { setUser(await api.me(token)); } catch { /* ignore */ }
  }, [token]);

  const isPartner = !!user?.tenants && user.tenants.length > 0;

  return (
    <AuthContext.Provider value={{ booting, token, user, isPartner, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
