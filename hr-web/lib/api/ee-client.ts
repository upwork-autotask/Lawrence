import { resource } from './client';
import type { TargetRow, ActualRow } from './contracts/ee';
import type { LookupRow } from './contracts/lookups';

export const recruitmentTargetsApi = resource<TargetRow>('/api/recruitment-targets');
export const actualRecruitmentApi = resource<ActualRow>('/api/actual-recruitment');
// Non-recruitment reasons have their own route (not in the generic lookups registry).
export const nonRecruitmentReasonsApi = resource<LookupRow>('/api/non-recruitment-reasons');
