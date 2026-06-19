import { and, asc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import { Errors } from './errors';
import type { Ctx } from './handler';
import type { Db } from '../db/client';

/**
 * Generic CRUD over any table that uses the standard columns (id, createdAt,
 * updatedAt, deletedAt, createdBy, updatedBy). Centralises soft-delete filtering,
 * optimistic concurrency (updatedAt token → 409), and audit logging so each
 * module service stays tiny. Tables are loosely typed here; the REST routes
 * validate every input/output against a Zod contract, so the boundary is safe.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyTable = any;

export async function crudList(
  tx: Db,
  table: AnyTable,
  opts: { limit?: number; offset?: number; where?: SQL[]; orderBy?: SQL } = {},
): Promise<{ items: any[]; total: number }> {
  const { limit = 50, offset = 0, where = [] } = opts;
  const conds = [isNull(table.deletedAt), ...where];
  const items = await (tx as any)
    .select()
    .from(table)
    .where(and(...conds))
    .limit(limit)
    .offset(offset)
    .orderBy(opts.orderBy ?? asc(table.createdAt));
  const [{ count }] = await (tx as any)
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(and(...conds));
  return { items, total: count };
}

export async function crudGet(tx: Db, table: AnyTable, id: string): Promise<any> {
  const [row] = await (tx as any)
    .select()
    .from(table)
    .where(and(eq(table.id, id), isNull(table.deletedAt)))
    .limit(1);
  if (!row) throw Errors.notFound();
  return row;
}

export async function crudCreate(ctx: Ctx, table: AnyTable, entityType: string, values: Record<string, unknown>): Promise<any> {
  const [row] = await (ctx.tx as any)
    .insert(table)
    .values({ ...values, createdBy: ctx.actor?.id ?? null, updatedBy: ctx.actor?.id ?? null })
    .returning();
  await ctx.audit({ action: 'create', entityType, entityId: row.id, after: row });
  return row;
}

export async function crudUpdate(
  ctx: Ctx,
  table: AnyTable,
  entityType: string,
  id: string,
  values: Record<string, unknown>,
  expectedUpdatedAt?: string | null,
): Promise<any> {
  const before = await crudGet(ctx.tx, table, id);
  if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== before.updatedAt.getTime()) {
    throw Errors.conflict();
  }
  const [row] = await (ctx.tx as any)
    .update(table)
    .set({ ...values, updatedBy: ctx.actor?.id ?? null, updatedAt: new Date() })
    .where(eq(table.id, id))
    .returning();
  await ctx.audit({ action: 'update', entityType, entityId: id, before, after: row });
  return row;
}

export async function crudSoftDelete(ctx: Ctx, table: AnyTable, entityType: string, id: string): Promise<{ id: string }> {
  const before = await crudGet(ctx.tx, table, id);
  await (ctx.tx as any)
    .update(table)
    .set({ deletedAt: new Date(), updatedBy: ctx.actor?.id ?? null })
    .where(eq(table.id, id));
  await ctx.audit({ action: 'delete', entityType, entityId: id, before });
  return { id };
}
