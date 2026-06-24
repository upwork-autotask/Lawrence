import { apiFetch } from './client';
import type { HrDashboard } from '@/lib/services/dashboard';

export const dashboardApi = {
  get: () => apiFetch<HrDashboard>('/api/dashboard'),
};

export type { HrDashboard } from '@/lib/services/dashboard';
