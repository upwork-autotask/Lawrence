import { z } from 'zod';

export const LookupKind = z.enum([
  'regions',
  'departments',
  'job_titles',
  'depots',
  'tiers',
  'paterson_grades',
  'ee_groups',
  'nbc_councils',
  'tax_statuses',
]);
export type LookupKind = z.infer<typeof LookupKind>;

export const LookupRow = z.object({
  id: z.number().int().positive(),
  code: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type LookupRow = z.infer<typeof LookupRow>;

export const LookupsListRequest = z.object({
  kind: LookupKind,
  includeInactive: z.boolean().default(false),
});

export const LookupsListResponse = z.object({
  rows: z.array(LookupRow),
});

export const LookupFormSchema = z.object({
  code: z.string().nullish(),
  name: z.string().min(1),
  description: z.string().nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type LookupFormValues = z.infer<typeof LookupFormSchema>;

export const LookupsCreateRequest = z.object({
  kind: LookupKind,
  values: LookupFormSchema,
});
export const LookupsUpdateRequest = z.object({
  kind: LookupKind,
  id: z.number().int().positive(),
  values: LookupFormSchema,
});
export const LookupsDeleteRequest = z.object({
  kind: LookupKind,
  id: z.number().int().positive(),
});
