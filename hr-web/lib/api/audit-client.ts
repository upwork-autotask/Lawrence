import { apiFetch } from './client';
import type { Paginated } from '../types/result';
import type { AuditRow } from '../services/audit';

const qs = (params?: Record<string, unknown>) => {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export type { AuditRow };

export const auditApi = {
  list: (params?: Record<string, unknown>) => apiFetch<Paginated<AuditRow>>(`/api/audit${qs(params)}`),
};
