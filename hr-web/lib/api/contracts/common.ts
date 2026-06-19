import { z } from 'zod';

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);

/** Optional string; '' and undefined normalise to null. */
export const optStr = z.preprocess(emptyToNull, z.string().nullable().optional());
/** Optional UUID FK; '' normalises to null. */
export const optUuid = z.preprocess(emptyToNull, z.string().uuid().nullable().optional());
/** Optional date; accepts ISO string or Date, '' → null. */
export const optDate = z.preprocess(emptyToNull, z.coerce.date().nullable().optional());
/** Optional number from a string/number input. */
export const optNum = z.preprocess(emptyToNull, z.coerce.number().nullable().optional());

/** Concurrency token clients echo back on update. */
export const expectedUpdatedAt = z.string().datetime().optional();

export const ListQuery = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});
