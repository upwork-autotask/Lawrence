import { z } from 'zod';
import { optStr, optUuid, optNum, expectedUpdatedAt, ListQuery } from './common';

// ── Interview question bank (tblInterview) ──
export const InterviewQuestionCreate = z.object({
  heading: optStr,
  question: z.string().min(1, 'Question is required'),
  modelAnswer: optStr,
  maxScore: z.coerce.number().default(5),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});
export const InterviewQuestionUpdate = InterviewQuestionCreate.partial().extend({ expectedUpdatedAt });
export const InterviewQuestionListQuery = ListQuery.extend({ heading: z.string().optional() });

// ── Interview scoring sheet (tblEmpInterview) — replace-all save ──
export const InterviewScoreItem = z.object({
  questionId: optUuid,
  question: optStr,
  score: optNum,
  answer: optStr,
  notes: optStr,
  sortOrder: z.coerce.number().int().default(0),
});
export const InterviewScoresSave = z.object({
  scores: z.array(InterviewScoreItem),
});

export type InterviewQuestionCreate = z.infer<typeof InterviewQuestionCreate>;
export type InterviewQuestionUpdate = z.infer<typeof InterviewQuestionUpdate>;
export type InterviewScoresSave = z.infer<typeof InterviewScoresSave>;

export type InterviewQuestionRow = {
  id: string;
  heading: string | null;
  question: string;
  modelAnswer: string | null;
  maxScore: number;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type InterviewScoreRow = {
  id: string;
  interviewId: string;
  questionId: string | null;
  question: string | null;
  score: number | null;
  answer: string | null;
  notes: string | null;
  sortOrder: number;
  updatedAt: string;
};
