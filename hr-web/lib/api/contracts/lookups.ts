import { z } from 'zod';
import { optStr, expectedUpdatedAt } from './common';

export const LookupCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  code: optStr,
  description: optStr,
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const LookupUpdate = LookupCreate.partial().extend({ expectedUpdatedAt });

export type LookupRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};
