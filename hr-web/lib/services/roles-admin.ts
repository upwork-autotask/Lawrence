import { and, asc, eq } from 'drizzle-orm';
import { roles, permissions, rolePermissions } from '../db/schema';
import { Errors } from '../api/errors';
import { Permissions } from '../auth/permissions';
import type { Ctx } from '../api/handler';

/**
 * Admin-facing Permissions/Roles editor backing the screen×role grid.
 *
 * The grid's permission rows come from the `permissions` table; if that table
 * has not been seeded we fall back to the hard-coded `Permissions` catalogue so
 * the editor is never empty. Toggling a cell inserts or deletes a single
 * `role_permissions` row inside the request transaction (idempotent, audited).
 */

/** Catalogue fallback rows, shaped like permission table rows but with a synthetic id. */
function catalogueRows() {
  return Object.values(Permissions).map((key) => ({
    id: `catalogue:${key}`,
    key,
    description: null as string | null,
  }));
}

/**
 * Build the full grid payload: every role, every permission key, and the set of
 * granted (roleId, permissionId) pairs as `${roleId}:${permissionId}` strings.
 */
export async function getPermissionGrid(ctx: Ctx) {
  const roleRows = await ctx.tx
    .select({ id: roles.id, name: roles.name, description: roles.description, isSystem: roles.isSystem })
    .from(roles)
    .orderBy(asc(roles.name));

  const permRows = await ctx.tx
    .select({ id: permissions.id, key: permissions.key, description: permissions.description })
    .from(permissions)
    .orderBy(asc(permissions.key));

  const fromTable = permRows.length > 0;
  const perms = fromTable ? permRows : catalogueRows();

  const grants = await ctx.tx
    .select({ roleId: rolePermissions.roleId, permissionId: rolePermissions.permissionId })
    .from(rolePermissions);

  const matrix = grants.map((g) => `${g.roleId}:${g.permissionId}`);

  return {
    roles: roleRows,
    permissions: perms,
    matrix,
    /** False when the `permissions` table is empty and the cells are read-only catalogue rows. */
    editable: fromTable,
  };
}

/**
 * Toggle a single (roleId, permissionId) grant: insert when `granted` is true,
 * delete when false. Validates that both ids exist. Idempotent — re-asserting an
 * existing state is a no-op. role_permissions has no updatedAt token, so there is
 * no optimistic-concurrency check (the operation is naturally idempotent).
 */
export async function togglePermission(
  ctx: Ctx,
  input: { roleId: string; permissionId: string; granted: boolean },
) {
  const { roleId, permissionId, granted } = input;

  const [role] = await ctx.tx.select({ id: roles.id }).from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!role) throw Errors.notFound('Role not found');

  const [perm] = await ctx.tx
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.id, permissionId))
    .limit(1);
  if (!perm) throw Errors.notFound('Permission not found');

  const [existing] = await ctx.tx
    .select({ id: rolePermissions.id })
    .from(rolePermissions)
    .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
    .limit(1);

  if (granted && !existing) {
    const [row] = await ctx.tx
      .insert(rolePermissions)
      .values({ roleId, permissionId, createdBy: ctx.actor?.id ?? null, updatedBy: ctx.actor?.id ?? null })
      .returning();
    await ctx.audit({ action: 'create', entityType: 'role_permission', entityId: row.id, after: row });
  } else if (!granted && existing) {
    await ctx.tx.delete(rolePermissions).where(eq(rolePermissions.id, existing.id));
    await ctx.audit({
      action: 'delete',
      entityType: 'role_permission',
      entityId: existing.id,
      before: { id: existing.id, roleId, permissionId },
    });
  }

  return { roleId, permissionId, granted };
}
