import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { SessionUser, LoginRequest, BootstrapRequest } from '@shared/ipc/auth';
import type { Result } from '@shared/types/result';

const TOKEN_STORAGE_KEY = 'hrapp.session.token';

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  login(req: LoginRequest): Promise<Result<{ user: SessionUser }>>;
  bootstrap(req: BootstrapRequest): Promise<Result<{ user: SessionUser }>>;
  logout(): Promise<void>;
  can(permission: string): boolean;
}

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = React.useState<SessionUser | null>(null);

  // Restore token on mount.
  React.useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) api.__setToken(stored);
  }, []);

  const session = useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<SessionUser | null> => {
      const r = await api.auth.session();
      return r.ok ? r.value : null;
    },
    staleTime: 5_000,
  });

  React.useEffect(() => {
    setUser(session.data ?? null);
  }, [session.data]);

  const loginMut = useMutation({
    mutationFn: async (req: LoginRequest) => api.auth.login(req),
    onSuccess: (r) => {
      if (r.ok) {
        api.__setToken(r.value.token);
        window.localStorage.setItem(TOKEN_STORAGE_KEY, r.value.token);
        setUser(r.value.user);
        qc.invalidateQueries({ queryKey: ['session'] });
      }
    },
  });

  const bootstrapMut = useMutation({
    mutationFn: async (req: BootstrapRequest) => api.auth.bootstrap(req),
    onSuccess: (r) => {
      if (r.ok) {
        api.__setToken(r.value.token);
        window.localStorage.setItem(TOKEN_STORAGE_KEY, r.value.token);
        setUser(r.value.user);
        qc.invalidateQueries({ queryKey: ['session'] });
      }
    },
  });

  async function logout() {
    await api.auth.logout();
    api.__setToken(null);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    qc.clear();
  }

  function can(permission: string): boolean {
    return !!user?.permissions.includes(permission);
  }

  const value: AuthCtx = {
    user,
    loading: session.isLoading,
    login: async (req) => {
      const r = await loginMut.mutateAsync(req);
      return r.ok ? { ok: true, value: { user: r.value.user } } : r;
    },
    bootstrap: async (req) => {
      const r = await bootstrapMut.mutateAsync(req);
      return r.ok ? { ok: true, value: { user: r.value.user } } : r;
    },
    logout,
    can,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function useCan(permission: string): boolean {
  return useAuth().can(permission);
}
