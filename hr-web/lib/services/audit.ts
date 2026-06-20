import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { auditLog } from '../db/schema';
import type { Ctx } from '../api/handler';

export type AuditRow = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  at: string;
};

export async function listAudit(
  ctx: Ctx,
  input: { q?: string; entityType?: string; action?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const conds: SQL[] = [];
  if (input.entityType) conds.push(eq(auditLog.entityType, input.entityType));
  if (input.action) conds.push(eq(auditLog.action, input.action));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await ctx.tx
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      at: auditLog.at,
    })
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.at))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await ctx.tx
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLog)
    .where(where);

  const items: AuditRow[] = rows.map((r) => ({ ...r, at: r.at.toISOString() }));
  return { items, total: count, page, pageSize };
}
