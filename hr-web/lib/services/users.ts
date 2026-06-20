import { and, asc, eq, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';
import { users, roles } from '../db/schema';
import { hashPassword } from '../auth/password';
import { Errors } from '../api/errors';
import type { Ctx } from '../api/handler';
import type { UserRow } from '../api/contracts/users';

/** Strip the password hash before anything leaves the service or hits the audit log. */
function redact<T extends { passwordHash?: unknown }>(row: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _omit, ...rest } = row;
  void _omit;
  return rest;
}

export async function listUsers(
  ctx: Ctx,
  input: { q?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const conds: SQL[] = [isNull(users.deletedAt)];
  if (input.q) {
    const like = `%${input.q}%`;
    conds.push(or(ilike(users.username, like), ilike(users.fullName, like)) as SQL);
  }
  const where = and(...conds);

  const rows = await ctx.tx
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      roleName: roles.name,
      isActive: users.isActive,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(where)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .orderBy(asc(users.username));

  const [{ count }] = await ctx.tx
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(where);

  const items: UserRow[] = rows.map((r) => ({
    ...r,
    updatedAt: r.updatedAt.toISOString(),
  }));
  return { items, total: count, page, pageSize };
}

type CreateInput = {
  fullName: string;
  username: string;
  password: string;
  roleId: string;
  employeeId?: unknown;
};

type UpdateInput = {
  fullName?: unknown;
  roleId?: unknown;
  isActive?: unknown;
  password?: unknown;
};

export async function createUser(ctx: Ctx, input: CreateInput) {
  const passwordHash = await hashPassword(input.password);
  const [row] = await ctx.tx
    .insert(users)
    .values({
      username: input.username,
      fullName: input.fullName,
      passwordHash,
      roleId: input.roleId,
      employeeId: (input.employeeId as string | null | undefined) ?? null,
      createdBy: ctx.actor?.id ?? null,
      updatedBy: ctx.actor?.id ?? null,
    })
    .returning();
  // Audit without the hash.
  await ctx.audit({ action: 'create', entityType: 'user', entityId: row.id, after: redact(row) });
  return redact(row);
}

export async function updateUser(
  ctx: Ctx,
  id: string,
  input: UpdateInput,
  expectedUpdatedAt?: string | null,
) {
  const [before] = await ctx.tx
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  if (!before) throw Errors.notFound();
  if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== before.updatedAt.getTime()) {
    throw Errors.conflict();
  }

  const values: Record<string, unknown> = { updatedBy: ctx.actor?.id ?? null, updatedAt: new Date() };
  if (input.fullName != null) values.fullName = input.fullName as string;
  if (input.roleId != null) values.roleId = input.roleId as string;
  if (input.isActive != null) values.isActive = input.isActive as boolean;
  if (input.password) values.passwordHash = await hashPassword(input.password as string);

  const [row] = await ctx.tx.update(users).set(values).where(eq(users.id, id)).returning();
  // Audit without either hash.
  await ctx.audit({ action: 'update', entityType: 'user', entityId: id, before: redact(before), after: redact(row) });
  return redact(row);
}

export async function deactivateUser(ctx: Ctx, id: string) {
  return updateUser(ctx, id, { isActive: false });
}
