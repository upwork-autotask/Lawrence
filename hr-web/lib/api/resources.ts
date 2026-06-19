import { resource, apiFetch } from './client';
import type { Paginated } from '../types/result';
import type { EmployeeRow } from './contracts/employees';
import type { LookupRow } from './contracts/lookups';

export const employeesApi = resource<EmployeeRow>('/api/employees');

export const lookupsApi = {
  list: (table: string) => apiFetch<Paginated<LookupRow>>(`/api/lookups/${table}`),
  create: (table: string, data: Record<string, unknown>) =>
    apiFetch<LookupRow>(`/api/lookups/${table}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (table: string, id: string, data: Record<string, unknown>) =>
    apiFetch<LookupRow>(`/api/lookups/${table}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (table: string, id: string) =>
    apiFetch<{ id: string }>(`/api/lookups/${table}/${id}`, { method: 'DELETE' }),
};
