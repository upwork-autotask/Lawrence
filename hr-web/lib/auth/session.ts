import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { getDb, type Db } from '../db/client';
import { users, roles, sessions, rolePermissions, permissions } from '../db/schema';
import { verifyToken } from './jwt';
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from './constants';

export { SESSION_COOKIE, SESSION_TTL_SECONDS };

export type Actor = {
  id: string;
  username: string;
  fullName: string;
  roleId: string;
  roleName: string;
  employeeId: string | null;
  permissions: Set<string>;
};

function tokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) return cookie;
  const auth = req.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return null;
}

/** Load a user and their resolved permission set. Returns null if inactive/missing. */
export async function loadActor(db: Db, userId: string): Promise<Actor | null> {
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      roleId: users.roleId,
      roleName: roles.name,
      employeeId: users.employeeId,
      isActive: users.isActive,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row || !row.isActive) return null;

  const perms = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, row.roleId));

  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    roleId: row.roleId,
    roleName: row.roleName,
    employeeId: row.employeeId,
    permissions: new Set(perms.map((p) => p.key)),
  };
}

/** Resolve the authenticated actor from a request (cookie or bearer), or null. */
export async function resolveActor(req: NextRequest): Promise<Actor | null> {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const claims = await verifyToken(token);
  if (!claims) return null;

  const db = await getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, claims.sid), eq(sessions.userId, claims.sub)))
    .limit(1);

  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;
  return loadActor(db, claims.sub);
}
