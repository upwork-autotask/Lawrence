import { resource } from './client';
import type {
  RequestRow,
  CandidateRow,
  InterviewRow,
  InterviewLeadRow,
  EvaluationRow,
  ReasonRow,
} from './contracts/recruitment';

export const requestsApi = resource<RequestRow>('/api/recruitment-requests');
export const candidatesApi = resource<CandidateRow>('/api/candidates');
export const interviewsApi = resource<InterviewRow>('/api/interviews');
export const interviewLeadsApi = resource<InterviewLeadRow>('/api/interview-leads');
export const evaluationsApi = resource<EvaluationRow>('/api/evaluations');
export const nonRecruitmentReasonsApi = resource<ReasonRow>('/api/non-recruitment-reasons');
