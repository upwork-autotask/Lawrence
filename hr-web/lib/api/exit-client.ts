import { resource } from './client';
import type { ExitRecordRow, ExitReasonRow } from './contracts/exit';

export const exitRecordsApi = resource<ExitRecordRow>('/api/exit-records');
export const exitReasonsApi = resource<ExitReasonRow>('/api/exit-reasons');
