import { resource, apiFetch } from './client';
import type {
  CandidateAssessmentRow,
  MakeEmployee,
  MakeEmployeeResult,
} from './contracts/recruitment-assessment';

export const candidateAssessmentsApi = resource<CandidateAssessmentRow>('/api/candidate-assessments');

/** Convert a candidate into an employee (Access "Make Employee" action). */
export const makeEmployee = (candidateId: string, data: MakeEmployee = {}) =>
  apiFetch<MakeEmployeeResult>(`/api/candidates/${candidateId}/make-employee`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
