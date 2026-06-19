import { eq, inArray } from 'drizzle-orm';
import type { Db } from '../db/client';
import { roles, permissions, rolePermissions } from '../db/schema';
import { Permissions, RolePermissions, RoleDescriptions } from './permissions';

/**
 * Idempotently seed the permission catalogue, roles, and role→permission grants.
 * Safe to call repeatedly (on bootstrap and on every seed run).
 */
export async function ensureRbacSeeded(db: Db): Promise<void> {
  // Permissions
  const allKeys = Object.values(Permissions);
  const existingPerms = await db.select().from(permissions);
  const existingKeys = new Set(existingPerms.map((p) => p.key));
  const toInsert = allKeys.filter((k) => !existingKeys.has(k));
  if (toInsert.length) {
    await db.insert(permissions).values(toInsert.map((key) => ({ key })));
  }
  const permRows = await db.select().from(permissions);
  const permByKey = new Map(permRows.map((p) => [p.key, p.id]));

  // Roles + grants
  for (const [roleName, perms] of Object.entries(RolePermissions)) {
    let [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
    if (!role) {
      [role] = await db
        .insert(roles)
        .values({ name: roleName, description: RoleDescriptions[roleName], isSystem: true })
        .returning();
    }
    const wantIds = perms.map((k) => permByKey.get(k)).filter((x): x is string => Boolean(x));
    const have = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    const haveSet = new Set(have.map((r) => r.permissionId));
    const missing = wantIds.filter((id) => !haveSet.has(id));
    if (missing.length) {
      await db.insert(rolePermissions).values(missing.map((permissionId) => ({ roleId: role.id, permissionId })));
    }
    // Prune grants no longer in the map (keeps super_admin fully in sync as perms grow).
    const stale = have.filter((r) => !wantIds.includes(r.permissionId)).map((r) => r.id);
    if (stale.length) {
      await db.delete(rolePermissions).where(inArray(rolePermissions.id, stale));
    }
  }
}
