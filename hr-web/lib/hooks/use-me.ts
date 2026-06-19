'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth-client';
import type { MeResponse } from '../api/contracts/auth';

export function useMe() {
  return useQuery<MeResponse | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const r = await authApi.me();
      return r.ok ? r.value : null;
    },
    staleTime: 60_000,
  });
}

export function can(me: MeResponse | null | undefined, permission: string): boolean {
  return Boolean(me?.permissions.includes(permission));
}
