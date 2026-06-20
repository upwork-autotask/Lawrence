import { resource } from './client';
import type {
  CriticalRoleRow, CriticalSkillRow, SuccessionCandidateRow, SuccessionCommitmentRow, SchemeRow,
} from './contracts/succession';

export const criticalRolesApi = resource<CriticalRoleRow>('/api/critical-roles');
export const criticalSkillsApi = resource<CriticalSkillRow>('/api/critical-skills');
export const successionCandidatesApi = resource<SuccessionCandidateRow>('/api/succession-candidates');
export const successionCommitmentsApi = resource<SuccessionCommitmentRow>('/api/succession-commitments');
export const successionSchemesApi = resource<SchemeRow>('/api/succession-schemes');
