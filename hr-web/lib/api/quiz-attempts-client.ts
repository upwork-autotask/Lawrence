import { resource, apiFetch } from './client';
import type { QuizAttemptRow, QuizAttemptSubmit } from './contracts/training';

const base = resource<QuizAttemptRow>('/api/quiz-attempts');

export const quizAttemptsApi = {
  ...base,
  /** Grade & finalise a sitting (sums selected-answer points). */
  submit: (id: string, data: QuizAttemptSubmit) =>
    apiFetch<QuizAttemptRow>(`/api/quiz-attempts/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
