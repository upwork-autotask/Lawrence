import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import {
  regions, departments, jobTitles, depots, tiers,
  patersonGrades, eeGroups, nbcCouncils, taxStatuses,
} from '@shared/schema';
import { and, eq, isNull, asc } from 'drizzle-orm';
import type { LookupKind, LookupRow, LookupFormValues } from '@shared/ipc/lookups';

type LookupTable =
  | typeof regions | typeof departments | typeof jobTitles | typeof depots
  | typeof tiers | typeof patersonGrades | typeof eeGroups
  | typeof nbcCouncils | typeof taxStatuses;

const TABLE_BY_KIND: Record<LookupKind, LookupTable> = {
  regions, departments,
  job_titles: jobTitles,
  depots, tiers,
  paterson_grades: patersonGrades,
  ee_groups: eeGroups,
  nbc_councils: nbcCouncils,
  tax_statuses: taxStatuses,
};

export function tableOf(kind: LookupKind): LookupTable {
  const t = TABLE_BY_KIND[kind];
  if (!t) throw new Error(`Unknown lookup kind: ${kind}`);
  return t;
}

export function listLookup(kind: LookupKind, includeInactive: boolean): LookupRow[] {
  const db = getDb();
  const t = tableOf(kind);
  const conds = [isNull(t.deletedAt)];
  if (!includeInactive) conds.push(eq(t.isActive, true));
  const rows = db.select().from(t).where(and(...conds)).orderBy(asc(t.sortOrder), asc(t.name)).all();
  return rows.map((r) => ({
    id: r.id,
    code: r.code ?? null,
    name: r.name,
    description: r.description ?? null,
    isActive: r.isActive,
    sortOrder: r.sortOrder,
  }));
}

export async function createLookup(kind: LookupKind, values: LookupFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const t = tableOf(kind);
    const inserted = tx.insert(t).values({
      code: values.code ?? null,
      name: values.name,
      description: values.description ?? null,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
      createdBy: userId,
      updatedBy: userId,
    }).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: kind, entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateLookup(
  kind: LookupKind, id: number, values: LookupFormValues, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const t = tableOf(kind);
    const before = tx.select().from(t).where(eq(t.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = {
      code: values.code ?? null,
      name: values.name,
      description: values.description ?? null,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
      updatedAt: new Date(),
      updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(t).set(next).where(eq(t.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: kind, entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after: next,
      },
    };
  });
}

export async function deleteLookup(kind: LookupKind, id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const t = tableOf(kind);
    const before = tx.select().from(t).where(eq(t.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(t).set({
      deletedAt: now, updatedAt: now, updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    }).where(eq(t.id, id)).run();
    return {
      result: null,
      envelope: {
        entity: kind, entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}
