import { resource } from './client';
import type {
  TrainingRow, TrainingInternalRow, TrainingExternalRow,
  QuizQuestionRow, QuizAnswerRow,
} from './contracts/training';

export const trainingsApi = resource<TrainingRow>('/api/trainings');
export const trainingInternalApi = resource<TrainingInternalRow>('/api/training-internal');
export const trainingExternalApi = resource<TrainingExternalRow>('/api/training-external');
export const quizQuestionsApi = resource<QuizQuestionRow>('/api/quiz-questions');
export const quizAnswersApi = resource<QuizAnswerRow>('/api/quiz-answers');
