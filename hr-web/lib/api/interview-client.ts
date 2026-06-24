import { resource, apiFetch } from './client';
import type { InterviewQuestionRow, InterviewScoreRow, InterviewScoresSave } from './contracts/interview';

export const interviewQuestionsApi = resource<InterviewQuestionRow>('/api/interview-questions');

export const interviewScoresApi = {
  list: (interviewId: string) =>
    apiFetch<{ items: InterviewScoreRow[]; total: number }>(`/api/interviews/${interviewId}/scores`),
  save: (interviewId: string, data: InterviewScoresSave) =>
    apiFetch<{ items: InterviewScoreRow[]; total: number }>(`/api/interviews/${interviewId}/scores`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
