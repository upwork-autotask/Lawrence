import { getDb } from './connection';
import { roles, rolePermissions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { RolePermissions } from '@shared/permissions';
import log from 'electron-log/main';

/**
 * Idempotent seed of system roles + permissions.
 * Safe to run on every startup.
 */
export function seedRolesAndPermissions(): void {
  const db = getDb();

  for (const [roleName, perms] of Object.entries(RolePermissions)) {
    let role = db.select().from(roles).where(eq(roles.name, roleName)).get();
    if (!role) {
      const inserted = db.insert(roles).values({
        name: roleName,
        description: `Built-in ${roleName} role`,
        isSystem: true,
      }).returning().get();
      role = inserted;
      log.info('Seeded role', roleName);
    }

    const existing = db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, role.id))
      .all()
      .map((r) => r.permission);

    const missing = perms.filter((p) => !existing.includes(p));
    if (missing.length > 0) {
      db.insert(rolePermissions)
        .values(missing.map((permission) => ({ roleId: role!.id, permission })))
        .run();
      log.info(`Seeded ${missing.length} permissions for ${roleName}`);
    }
  }
}
