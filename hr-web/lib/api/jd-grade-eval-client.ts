import { resource, apiFetch } from './client';
import type { Paginated } from '../types/result';
import type { JdGradeEvalRow } from './contracts/jd-grade-eval';

const base = resource<JdGradeEvalRow>('/api/jd-grade-evaluations');

export const jdGradeEvalApi = {
  ...base,
  /** Typed list with the register filter params. */
  list: (params?: Record<string, unknown>) =>
    apiFetch<Paginated<JdGradeEvalRow>>(`/api/jd-grade-evaluations${query(params)}`),
};

function query(params?: Record<string, unknown>) {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
