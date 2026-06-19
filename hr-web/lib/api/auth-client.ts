import { apiFetch } from './client';
import type { BootstrapInput, MeResponse } from './contracts/auth';

export const authApi = {
  status: () => apiFetch<{ usersExist: boolean }>('/api/auth/status'),
  me: () => apiFetch<MeResponse>('/api/auth/me'),
  login: (username: string, password: string) =>
    apiFetch<{ user: { username: string; fullName: string; roleName: string }; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  bootstrap: (data: BootstrapInput) =>
    apiFetch('/api/auth/bootstrap', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
};
