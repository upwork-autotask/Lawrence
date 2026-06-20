import { apiFetch } from './client';
import type { ReportSummary } from '../services/reports';

export type { ReportSummary };

export const reportsApi = {
  summary: () => apiFetch<ReportSummary>('/api/reports/summary'),
};
