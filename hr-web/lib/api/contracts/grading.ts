import { z } from 'zod';
import { optStr, optNum, expectedUpdatedAt, ListQuery } from './common';

export const GradingCreate = z.object({
  scale: optStr,
  occLevel: optStr,
  jobTitle: optStr,
  code: optStr,
  patersonGrade: optStr,
  patersonBand: optStr,
  minRate: optNum,
  maxRate: optNum,
});

export const GradingUpdate = GradingCreate.partial().extend({ expectedUpdatedAt });

export const GradingListQuery = ListQuery.extend({
  patersonGrade: z.string().optional(),
});

export type GradingCreate = z.infer<typeof GradingCreate>;
export type GradingUpdate = z.infer<typeof GradingUpdate>;

export type GradingRow = {
  id: string;
  scale: string | null;
  occLevel: string | null;
  jobTitle: string | null;
  code: string | null;
  patersonGrade: string | null;
  patersonBand: string | null;
  minRate: number | null;
  maxRate: number | null;
  updatedAt: string;
};
