import { resource, apiFetch } from './client';
import type { UserRow, UserCreate, UserUpdate } from './contracts/users';

export type RoleOption = { id: string; name: string; description: string | null };

export const usersApi = resource<UserRow, UserCreate, UserUpdate>('/api/users');

export const rolesApi = {
  list: () => apiFetch<{ items: RoleOption[] }>('/api/roles'),
};
