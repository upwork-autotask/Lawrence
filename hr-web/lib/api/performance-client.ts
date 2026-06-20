import { resource } from './client';
import type { PerformanceRow, KpiRow, KpiCategoryRow } from './contracts/performance';

export const performanceApi = resource<PerformanceRow>('/api/performance');
export const kpisApi = resource<KpiRow>('/api/kpis');
export const kpiCategoriesApi = resource<KpiCategoryRow>('/api/kpi-categories');
