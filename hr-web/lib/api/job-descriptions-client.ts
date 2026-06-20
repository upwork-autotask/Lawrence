import { resource } from './client';
import type { JdRow, JdEntryRow, JdRoleRow, EmployeeJdRow } from './contracts/job-descriptions';

export const jdApi = resource<JdRow>('/api/job-descriptions');
export const jdEntriesApi = resource<JdEntryRow>('/api/jd-entries');
export const jdRolesApi = resource<JdRoleRow>('/api/jd-roles');
export const employeeJdsApi = resource<EmployeeJdRow>('/api/employee-jds');
export const jdKpisApi = resource<Record<string, unknown>>('/api/jd-kpis');
export const jdTrainingInternalApi = resource<Record<string, unknown>>('/api/jd-training-internal');
export const jdTrainingExternalApi = resource<Record<string, unknown>>('/api/jd-training-external');
