import { resource } from './client';
import type { KpiCategoryRow } from './contracts/performance';

export const kpiCategoriesApi = resource<KpiCategoryRow>('/api/kpi-categories');
